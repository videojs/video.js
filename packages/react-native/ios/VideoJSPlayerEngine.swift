import AVFoundation
import Foundation

/// Mirrors `PlayerEvent['type']` in `src/media/NativeEngineStore.ts`.
enum VideoJSPlayerEventType {
  case loadstart
  case emptied
  case loadedmetadata
  case durationchange
  case progress
  case canplay
  case canplaythrough
  case error
  case play
  case pause
  case playing
  case waiting
  case ended
  case timeupdate
  case ratechange
  case seeking
  case seeked
  case contentdatachange

  var jsName: String {
    switch self {
    case .loadstart: "loadstart"
    case .emptied: "emptied"
    case .loadedmetadata: "loadedmetadata"
    case .durationchange: "durationchange"
    case .progress: "progress"
    case .canplay: "canplay"
    case .canplaythrough: "canplaythrough"
    case .error: "error"
    case .play: "play"
    case .pause: "pause"
    case .playing: "playing"
    case .waiting: "waiting"
    case .ended: "ended"
    case .timeupdate: "timeupdate"
    case .ratechange: "ratechange"
    case .seeking: "seeking"
    case .seeked: "seeked"
    case .contentdatachange: "contentdatachange"
    }
  }
}

/// `MediaError` codes.
private enum MediaErrorCode {
  static let network = 2
  static let decode = 3
  static let srcNotSupported = 4
  static let encrypted = 5
  static let custom = 100
}

/// `HTMLMediaElement.readyState` values.
private enum ReadyState {
  static let haveNothing = 0
  static let haveMetadata = 1
  static let haveCurrentData = 2
  static let haveFutureData = 3
  static let haveEnoughData = 4
}

// HTMLMediaElement fires `timeupdate` every 15–250ms during playback.
private let timeUpdateInterval = CMTime(value: 1, timescale: 4)

/// One player behind one handle. Confined to the main queue — every entry point
/// is reached either from `VideoJSPlayerRegistry`'s main-queue dispatch or from
/// the Fabric surface, which is already on the main queue.
///
/// The one exception is the `VideoJSPlayerState` snapshot, which the JS thread
/// reads through `readState()`. The engine republishes it before every event,
/// so a getter called while handling one sees state at least that new. One lock
/// covers the whole snapshot.
@objc
public final class VideoJSPlayerEngine: NSObject {
  // Always an AVQueuePlayer, even with looping off, so enabling loop later
  // never changes player identity — see decisions.md § iOS looping uses an
  // always-present AVQueuePlayer.
  private let player = AVQueuePlayer()

  // The engine renders into the most recently attached layer only. Lower
  // entries stay registered so a pop can fall back to the layer below without
  // it having to re-register.
  private var layers: [AVPlayerLayer] = []

  private let stateLock = NSLock()
  private var state = VideoJSPlayerState.initial

  /// Receives the `PlayerEvent` payload minus the handle the registry adds.
  private var onEvent: (([String: Any]) -> Void)?
  private var playerObservations: [NSKeyValueObservation] = []
  private var timeObserver: Any?
  private var invalidated = false

  // KVO reports the new status, not the transition, and the media events are
  // transitions — `play` is leaving paused, `playing` is entering playing.
  private var timeControlStatus: AVPlayer.TimeControlStatus = .paused

  // Per source; replaced when the source is swapped.
  private var source: String?
  private var item: AVPlayerItem?
  private var itemObservations: [NSKeyValueObservation] = []
  private var metadataLoaded = false
  private var reportedDuration = CMTime.invalid
  private var likelyToKeepUp = false
  private var ended = false
  private var lastError: [String: Any]?
  private var reportedContentData: [String: String] = [:]

  // Only the newest seek's completion settles `seeking`; a superseded seek
  // completes unfinished and stays quiet, as on the web.
  private var seeking = false
  private var seekGeneration = 0

  // An item can't seek until it is ready, so an earlier request waits — the
  // media element's default playback start position.
  private var pendingStartTime: Double?

  // AVFoundation has no "enough data to start" signal of its own, so this is
  // the media element's HAVE_FUTURE_DATA as far as the player reveals it:
  // gained on readiness or playback resuming, lost to a stall.
  private var canPlay = false

  /// A nil source leaves the player idle until `setSource(_:)` supplies one.
  @objc(initWithSource:onEvent:)
  public init(source: String?, onEvent: @escaping ([String: Any]) -> Void) {
    self.onEvent = onEvent

    super.init()

    // The queue default advances past the finished item, leaving nothing to
    // render. Holding keeps the last frame up, matching ExoPlayer.
    player.actionAtItemEnd = .pause

    playerObservations.append(player.observe(\.timeControlStatus) { [weak self] _, _ in
      self?.onMainQueue { $0.syncTimeControlStatus() }
    })

    // `rate` drops to zero on every pause; `defaultRate` is the one that
    // matches `playbackRate`. Before iOS 16 there is nothing to observe.
    if #available(iOS 16, *) {
      playerObservations.append(player.observe(\.defaultRate, options: [.old, .new]) { [weak self] _, change in
        guard change.oldValue != change.newValue else { return }

        self?.onMainQueue { $0.emit(.ratechange) }
      })
    }

    // Also fires when playback starts or stops and when time jumps, which is
    // when a media element reports position too.
    // The payload reads the same accessor as the state snapshot, so the two
    // always agree.
    timeObserver = player.addPeriodicTimeObserver(forInterval: timeUpdateInterval, queue: .main) { [weak self] time in
      guard let self, item != nil, time.isNumeric else { return }

      emit(.timeupdate, ["currentTime": currentTime])
    }

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleItemDidPlayToEnd(_:)),
      name: AVPlayerItem.didPlayToEndTimeNotification,
      object: nil
    )

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleItemFailedToPlayToEnd(_:)),
      name: AVPlayerItem.failedToPlayToEndTimeNotification,
      object: nil
    )

    if let source {
      setSource(source)
    }
  }

  deinit {
    // The observers must be gone before the observed player is torn down, and
    // the player dies with us.
    invalidate()
  }

  // AVQueuePlayer documents replaceCurrentItem(with:) as unsupported, so the
  // swap goes through the queue. removeAllItems drops the rate, so a player
  // that was playing is restarted to match ExoPlayer's surviving
  // `playWhenReady`.
  @objc(setSource:)
  public func setSource(_ source: String) {
    let next = URL(string: source).map { AVPlayerItem(url: $0) }
    let wasPlaying = player.timeControlStatus != .paused
    let hadItem = item != nil

    player.removeAllItems()
    observe(next)

    self.source = source

    if hadItem {
      emit(.emptied)
    }

    clearContentData()
    emit(.loadstart)

    // A media element fails an unusable src asynchronously rather than
    // rejecting it, so it reads as a load that errored.
    guard let next else {
      emitError(playerError(code: MediaErrorCode.srcNotSupported, message: "Invalid source URL: \(source)"))
      return
    }

    player.insert(next, after: nil)

    if wasPlaying {
      player.play()
    }
  }

  @objc
  public func load() {
    if let source {
      setSource(source)
    }
  }

  // A media element restarts from the beginning when played after the end.
  @objc
  public func play() {
    if ended {
      setCurrentTime(0)
    }

    player.play()
  }

  @objc
  public func pause() {
    player.pause()
  }

  @objc(setCurrentTime:)
  public func setCurrentTime(_ seconds: Double) {
    guard let item else { return }

    ended = false

    guard metadataLoaded else {
      pendingStartTime = seconds
      return
    }

    seeking = true
    seekGeneration += 1

    let generation = seekGeneration
    let time = CMTime(seconds: max(seconds, 0), preferredTimescale: 600)

    emit(.seeking)
    player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] finished in
      self?.onMainQueue(for: item) { engine in
        guard generation == engine.seekGeneration else { return }

        engine.seeking = false

        if finished {
          engine.emit(.seeked)
        }
      }
    }
  }

  // MARK: State

  /// Any thread.
  @objc
  public func readState() -> VideoJSPlayerState {
    stateLock.withLock { state }
  }

  private func resetState() {
    stateLock.withLock { state = .initial }
  }

  private var currentTime: Double {
    let time = player.currentTime()

    return time.isNumeric ? time.seconds : 0
  }

  // Duration reads indefinite until the item is ready, which is
  // indistinguishable from live, so it only counts once metadata has loaded.
  private var duration: Double {
    guard let item, metadataLoaded else { return .nan }

    return item.duration.isIndefinite ? .infinity : item.duration.seconds
  }

  private var readyState: Int {
    guard let item, metadataLoaded else { return ReadyState.haveNothing }

    if likelyToKeepUp { return ReadyState.haveEnoughData }
    if canPlay { return ReadyState.haveFutureData }

    let now = player.currentTime()
    let hasCurrentData = item.loadedTimeRanges.contains { $0.timeRangeValue.containsTime(now) }

    return hasCurrentData ? ReadyState.haveCurrentData : ReadyState.haveMetadata
  }

  // `rate` is zero whenever paused; `defaultRate` is the one that matches
  // `playbackRate`, but only from iOS 16.
  private var playbackRate: Double {
    if #available(iOS 16, *) {
      return Double(player.defaultRate)
    }

    return player.rate == 0 ? 1 : Double(player.rate)
  }

  private func publishState() {
    if invalidated { return }

    let next = VideoJSPlayerState(
      currentTime: currentTime,
      duration: duration,
      buffered: timeRanges(item?.loadedTimeRanges ?? []),
      seekable: timeRanges(item?.seekableTimeRanges ?? []),
      error: lastError,
      paused: player.timeControlStatus == .paused,
      ended: ended,
      seeking: seeking,
      currentSrc: source ?? "",
      readyState: readyState,
      playbackRate: playbackRate,
      contentData: reportedContentData
    )

    stateLock.withLock { state = next }
  }

  @objc(attachLayer:)
  public func attach(_ layer: AVPlayerLayer) {
    layers.removeAll { $0 === layer }
    layers.append(layer)
    repointLayers()
  }

  @objc(detachLayer:)
  public func detach(_ layer: AVPlayerLayer) {
    layers.removeAll { $0 === layer }
    layer.player = nil
    repointLayers()
  }

  @objc
  public func invalidate() {
    if invalidated { return }

    invalidated = true

    resetState()
    playerObservations.forEach { $0.invalidate() }
    playerObservations.removeAll()
    observe(nil)
    NotificationCenter.default.removeObserver(self)

    if let timeObserver {
      player.removeTimeObserver(timeObserver)
      self.timeObserver = nil
    }

    for layer in layers {
      layer.player = nil
    }

    layers.removeAll()
    player.pause()
    player.removeAllItems()

    onEvent = nil
  }

  // Only one layer may draw a given player, so the top of the stack takes it
  // and everything below is cleared.
  private func repointLayers() {
    let top = layers.last

    for layer in layers {
      layer.player = layer === top ? player : nil
    }
  }

  // Swaps the per-item observations and resets the per-source state, so
  // nothing from the previous item is reported against the next.
  private func observe(_ next: AVPlayerItem?) {
    itemObservations.forEach { $0.invalidate() }
    itemObservations.removeAll()

    item = next
    metadataLoaded = false
    reportedDuration = .invalid
    likelyToKeepUp = false
    canPlay = false
    ended = false
    lastError = nil
    seeking = false
    seekGeneration += 1
    pendingStartTime = nil

    guard let next else { return }

    itemObservations = [
      next.observe(\.status) { [weak self] item, _ in
        self?.onMainQueue(for: item) { $0.syncItemStatus() }
      },
      next.observe(\.duration) { [weak self] item, _ in
        self?.onMainQueue(for: item) { $0.syncDuration() }
      },
      next.observe(\.loadedTimeRanges) { [weak self] item, _ in
        self?.onMainQueue(for: item) { $0.emitProgress() }
      },
      next.observe(\.isPlaybackLikelyToKeepUp) { [weak self] item, _ in
        self?.onMainQueue(for: item) { $0.syncLikelyToKeepUp() }
      },
      // A live window slides with no media event to carry it.
      next.observe(\.seekableTimeRanges) { [weak self] item, _ in
        self?.onMainQueue(for: item) { $0.publishState() }
      },
    ]
  }

  private func syncTimeControlStatus() {
    let previous = timeControlStatus
    let next = player.timeControlStatus

    if next == previous { return }

    timeControlStatus = next

    if previous == .paused {
      emit(.play)
    } else if next == .paused {
      emit(.pause)
    }

    if next == .playing {
      syncCanPlay(true)
      emit(.playing)
    } else if next == .waitingToPlayAtSpecifiedRate {
      syncCanPlay(false)
      emit(.waiting)
    }
  }

  private func syncItemStatus() {
    guard let item else { return }

    switch item.status {
    case .readyToPlay where !metadataLoaded:
      metadataLoaded = true
      syncDuration()
      emit(.loadedmetadata)
      syncCanPlay(true)
      syncLikelyToKeepUp()
      loadContentData(for: item)

      if let pendingStartTime {
        self.pendingStartTime = nil
        setCurrentTime(pendingStartTime)
      }
    case .failed:
      emitError(playerError(from: item.error))
    default:
      break
    }
  }

  private func syncDuration() {
    guard let item, metadataLoaded, item.duration != reportedDuration else { return }

    reportedDuration = item.duration
    emit(.durationchange, ["duration": duration])
  }

  // Gated on metadata so the load order matches a media element's:
  // `loadedmetadata`, `canplay`, `canplaythrough`.
  private func syncLikelyToKeepUp() {
    guard let item, metadataLoaded, item.isPlaybackLikelyToKeepUp != likelyToKeepUp else { return }

    likelyToKeepUp = item.isPlaybackLikelyToKeepUp

    // Losing it changes `readyState` with no media event to carry it.
    if likelyToKeepUp {
      syncCanPlay(true)
      emit(.canplaythrough)
    } else {
      publishState()
    }
  }

  private func syncCanPlay(_ next: Bool) {
    if next == canPlay { return }

    canPlay = next

    if canPlay {
      emit(.canplay)
    }
  }

  private func emitProgress() {
    emit(.progress, ["buffered": timeRanges(item?.loadedTimeRanges ?? [])])
  }

  private func emitError(_ error: [String: Any]) {
    lastError = error
    emit(.error, ["error": error])
  }

  // Asset metadata loads separately from the item, so it can land after a
  // source swap and is dropped if so.
  private func loadContentData(for item: AVPlayerItem) {
    Task { [weak self] in
      let contentData = await loadCommonContentData(from: item.asset)

      self?.onMainQueue(for: item) { $0.syncContentData(contentData) }
    }
  }

  private func syncContentData(_ next: [String: String]) {
    if next == reportedContentData { return }

    reportedContentData = next
    emit(.contentdatachange)
  }

  private func clearContentData() {
    syncContentData([:])
  }

  @objc
  private func handleItemDidPlayToEnd(_ notification: Notification) {
    onMainQueue(forNotification: notification) { engine in
      engine.ended = true
      engine.emit(.ended)
    }
  }

  @objc
  private func handleItemFailedToPlayToEnd(_ notification: Notification) {
    let error = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? Error

    onMainQueue(forNotification: notification) { $0.emitError(playerError(from: error)) }
  }

  // KVO and notification delivery aren't guaranteed on the main queue, but the
  // per-source state and the player are.
  private func onMainQueue(_ body: @escaping (VideoJSPlayerEngine) -> Void) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }

      body(self)
    }
  }

  // A hop queued before a source swap lands after it, so it is dropped unless
  // the item it came from is still current.
  private func onMainQueue(for source: AVPlayerItem, _ body: @escaping (VideoJSPlayerEngine) -> Void) {
    onMainQueue { engine in
      guard source === engine.item else { return }

      body(engine)
    }
  }

  // Item notifications are unfiltered, so ignore items belonging to other
  // engines.
  private func onMainQueue(forNotification notification: Notification, _ body: @escaping (VideoJSPlayerEngine) -> Void) {
    guard let source = notification.object as? AVPlayerItem else { return }

    onMainQueue(for: source, body)
  }

  private func emit(_ type: VideoJSPlayerEventType, _ values: [String: Any] = [:]) {
    if invalidated { return }

    publishState()
    onEvent?(values.merging(["type": type.jsName]) { _, type in type })
  }
}

private func timeRanges(_ values: [NSValue]) -> [[String: Double]] {
  values
    .map(\.timeRangeValue)
    .sorted { $0.start < $1.start }
    .map { ["start": $0.start.seconds, "end": $0.end.seconds] }
}

/// Only what the content itself carries; a key is absent unless supplied.
private func loadCommonContentData(from asset: AVAsset) async -> [String: String] {
  guard let metadata = try? await asset.load(.commonMetadata) else { return [:] }

  var contentData: [String: String] = [:]

  if let title = AVMetadataItem.metadataItems(from: metadata, filteredByIdentifier: .commonIdentifierTitle).first,
     let value = try? await title.load(.stringValue)
  {
    contentData["title"] = value
  }

  if let artwork = AVMetadataItem.metadataItems(from: metadata, filteredByIdentifier: .commonIdentifierArtwork).first,
     let data = try? await artwork.load(.dataValue),
     let uri = imageDataURI(data)
  {
    contentData["poster"] = uri
  }

  return contentData
}

// Embedded artwork has no URL, so it is inlined. Only formats an image view can
// be relied on to decode are reported.
private func imageDataURI(_ data: Data) -> String? {
  let mimeType: String

  if data.starts(with: [0xFF, 0xD8, 0xFF]) {
    mimeType = "image/jpeg"
  } else if data.starts(with: [0x89, 0x50, 0x4E, 0x47]) {
    mimeType = "image/png"
  } else {
    return nil
  }

  return "data:\(mimeType);base64,\(data.base64EncodedString())"
}

private func playerError(code: Int, message: String) -> [String: Any] {
  ["code": code, "message": message]
}

private func playerError(from error: Error?) -> [String: Any] {
  guard let error = error as NSError? else {
    return playerError(code: MediaErrorCode.custom, message: "")
  }

  return playerError(code: mediaErrorCode(for: error), message: error.localizedDescription)
}

private func mediaErrorCode(for error: NSError) -> Int {
  switch (error.domain, AVError.Code(rawValue: error.code)) {
  case (NSURLErrorDomain, _):
    return MediaErrorCode.network
  // HLS delivery failures (playlist or segment HTTP errors) surface here.
  case ("CoreMediaErrorDomain", _):
    return MediaErrorCode.network
  case (AVFoundationErrorDomain, .decodeFailed?), (AVFoundationErrorDomain, .decoderNotFound?),
       (AVFoundationErrorDomain, .decoderTemporarilyUnavailable?):
    return MediaErrorCode.decode
  case (AVFoundationErrorDomain, .fileFormatNotRecognized?), (AVFoundationErrorDomain, .fileFailedToParse?),
       (AVFoundationErrorDomain, .contentIsUnavailable?):
    return MediaErrorCode.srcNotSupported
  case (AVFoundationErrorDomain, .contentIsProtected?), (AVFoundationErrorDomain, .contentIsNotAuthorized?):
    return MediaErrorCode.encrypted
  default:
    // AVFoundation often reports a generic failure that wraps the real cause.
    if let underlying = error.userInfo[NSUnderlyingErrorKey] as? NSError {
      return mediaErrorCode(for: underlying)
    }

    return MediaErrorCode.custom
  }
}

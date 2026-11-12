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

/// One player behind one handle. Built on the calling (JS) thread so a command
/// issued right after `createPlayer` has an engine to reach, but the player
/// itself is confined to the main queue: commands are callable from any thread
/// and dispatch their player work to the main queue, and the Fabric surface is
/// already on the main queue.
///
/// The exception is the `VideoJSPlayerState` snapshot, which is the only copy
/// of the state the getters report. One lock guards it, and every change
/// replaces it with an edited `copy(…)` without giving the lock up in between.
/// Two kinds of writer share it:
/// - Commands write what they mean, on the calling thread, before dispatching
///   the player work to the main queue, so a getter called right after one
///   reflects it as a media element's would.
/// - The engine writes what the player reports, on the main queue, before
///   emitting the event that announces it, so a getter called while handling an
///   event sees state at least that new.
///
/// Where the two disagree, the engine's write defers to the snapshot: it leaves
/// `currentTime` alone while a seek is pending, and writes per-source values
/// only while `currentSrc` is still the source it's playing.
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
  private var state: VideoJSPlayerState

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
  private var likelyToKeepUp = false
  private var atEnd = false
  private var hasContentData = false

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
    self.state = VideoJSPlayerState.initial.copy(currentSrc: source ?? "")
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

        self?.onMainQueue { engine in
          engine.update { $0.copy(playbackRate: engine.playbackRate) }
          engine.emit(.ratechange)
        }
      })
    }

    // Also fires when playback starts or stops and when time jumps, which is
    // when a media element reports position too.
    timeObserver = player.addPeriodicTimeObserver(forInterval: timeUpdateInterval, queue: .main) { [weak self] time in
      guard let self, item != nil, time.isNumeric else { return }

      emitTimeUpdate()
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

    // The snapshot already holds the source as `currentSrc`.
    if let source {
      onMainQueue { $0.setSourceInternal(source) }
    }
  }

  deinit {
    // The observers must be gone before the observed player is torn down, and
    // the player dies with us.
    invalidate()
  }

  // MARK: Commands — any thread; each writes its state, then dispatches its player work

  // A new source starts from a media element's initial state; only `paused`
  // and `playbackRate` belong to the element rather than the source.
  @objc(setSource:)
  public func setSource(_ source: String) {
    update { .initial.copy(paused: $0.paused, currentSrc: source, playbackRate: $0.playbackRate) }
    onMainQueue { $0.setSourceInternal(source) }
  }

  @objc
  public func load() {
    update { $0.currentSrc.isEmpty ? $0 : .initial.copy(paused: $0.paused, currentSrc: $0.currentSrc, playbackRate: $0.playbackRate) }
    onMainQueue { engine in
      if let source = engine.source {
        engine.setSourceInternal(source)
      }
    }
  }

  // Playing after the end restarts from the beginning, which is a seek.
  @objc
  public func play() {
    update { $0.ended ? $0.copy(currentTime: 0, paused: false, ended: false, seeking: true) : $0.copy(paused: false) }
    onMainQueue { engine in
      if engine.atEnd {
        engine.seek(to: 0)
      }

      engine.player.play()
    }
  }

  @objc
  public func pause() {
    update { $0.copy(paused: true) }
    onMainQueue { $0.player.pause() }
  }

  @objc(setCurrentTime:)
  public func setCurrentTime(_ seconds: Double) {
    let target = max(seconds, 0)

    update { $0.currentSrc.isEmpty ? $0 : $0.copy(currentTime: target, ended: false, seeking: true) }
    onMainQueue { $0.seek(to: target) }
  }

  // AVQueuePlayer documents replaceCurrentItem(with:) as unsupported, so the
  // swap goes through the queue. removeAllItems drops the rate, so a player
  // that was playing is restarted to match ExoPlayer's surviving
  // `playWhenReady`.
  @MainActor
  private func setSourceInternal(_ source: String) {
    let next = URL(string: source).map { AVPlayerItem(url: $0) }
    let wasPlaying = player.timeControlStatus != .paused
    let hadItem = item != nil
    let hadContentData = hasContentData

    player.removeAllItems()
    observe(next)

    self.source = source

    if hadItem {
      emit(.emptied)
    }

    if hadContentData {
      emit(.contentdatachange)
    }

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

  // MARK: State

  /// Any thread.
  @objc
  public func readState() -> VideoJSPlayerState {
    stateLock.withLock { state }
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

  /// Any thread. Returns the snapshot it left in place.
  @discardableResult
  private func update(_ transform: (VideoJSPlayerState) -> VideoJSPlayerState) -> VideoJSPlayerState {
    stateLock.withLock {
      state = transform(state)
      return state
    }
  }

  // Per-source values belong to the source the player is on. Once a command
  // has moved `currentSrc` on, they would only leak the old source into the
  // new one's state.
  @discardableResult
  private func updateForSource(_ transform: (VideoJSPlayerState) -> VideoJSPlayerState) -> VideoJSPlayerState {
    let current = source ?? ""

    return update { $0.currentSrc == current ? transform($0) : $0 }
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

    update { _ in .initial }
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

  // Swaps the per-item observations and resets the per-source bookkeeping, so
  // nothing from the previous item is reported against the next.
  private func observe(_ next: AVPlayerItem?) {
    itemObservations.forEach { $0.invalidate() }
    itemObservations.removeAll()

    item = next
    metadataLoaded = false
    likelyToKeepUp = false
    canPlay = false
    atEnd = false
    hasContentData = false
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
        self?.onMainQueue(for: item) { engine in
          engine.updateForSource { $0.copy(seekable: timeRanges(item.seekableTimeRanges)) }
        }
      },
    ]
  }

  // An item can't seek until it is ready, so an earlier seek becomes the start
  // position. Superseded seeks complete unfinished; `settleSeek` keeps them
  // quiet.
  private func seek(to seconds: Double) {
    guard let item else { return }

    atEnd = false

    guard metadataLoaded else {
      pendingStartTime = seconds
      return
    }

    let time = CMTime(seconds: seconds, preferredTimescale: 600)

    emit(.seeking)
    player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] finished in
      self?.onMainQueue(for: item) { $0.settleSeek(to: seconds, finished: finished) }
    }
  }

  // A newer seek, or a new source, has replaced `currentTime` since this seek
  // was requested; that one settles `seeking` instead, so this stays quiet as a
  // superseded seek does on the web.
  private func settleSeek(to target: Double, finished: Bool) {
    guard finished else { return }

    var settled = false

    updateForSource {
      guard $0.seeking, $0.currentTime == target else { return $0 }

      settled = true
      return $0.copy(currentTime: currentTime, seeking: false)
    }

    if settled {
      emit(.seeked)
    }
  }

  private func syncTimeControlStatus() {
    let previous = timeControlStatus
    let next = player.timeControlStatus

    if next == previous { return }

    timeControlStatus = next

    if previous == .paused {
      update { $0.copy(paused: false) }
      emit(.play)
    } else if next == .paused {
      update { $0.copy(paused: true) }
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
      updateForSource { $0.copy(seekable: timeRanges(item.seekableTimeRanges), readyState: readyState) }
      emit(.loadedmetadata)
      syncCanPlay(true)
      syncLikelyToKeepUp()
      loadContentData(for: item)

      if let pendingStartTime {
        self.pendingStartTime = nil
        seek(to: pendingStartTime)
      }
    case .failed:
      emitError(playerError(from: item.error))
    default:
      break
    }
  }

  private func syncDuration() {
    guard metadataLoaded, let item else { return }

    let next = duration
    var changed = false

    updateForSource {
      guard $0.duration != next else { return $0 }

      changed = true
      return $0.copy(duration: next, seekable: timeRanges(item.seekableTimeRanges))
    }

    if changed {
      emit(.durationchange, ["duration": next])
    }
  }

  // Gated on metadata so the load order matches a media element's:
  // `loadedmetadata`, `canplay`, `canplaythrough`.
  private func syncLikelyToKeepUp() {
    guard let item, metadataLoaded, item.isPlaybackLikelyToKeepUp != likelyToKeepUp else { return }

    likelyToKeepUp = item.isPlaybackLikelyToKeepUp
    updateForSource { $0.copy(readyState: readyState) }

    if likelyToKeepUp {
      syncCanPlay(true)
      emit(.canplaythrough)
    }
  }

  private func syncCanPlay(_ next: Bool) {
    if next == canPlay { return }

    canPlay = next
    updateForSource { $0.copy(readyState: readyState) }

    if canPlay {
      emit(.canplay)
    }
  }

  // A pending seek owns `currentTime`, so the payload reports what the
  // snapshot holds rather than the player's position.
  private func emitTimeUpdate() {
    let reported = updateForSource { $0.seeking ? $0 : $0.copy(currentTime: currentTime) }

    emit(.timeupdate, ["currentTime": reported.currentTime])
  }

  private func emitProgress() {
    let buffered = timeRanges(item?.loadedTimeRanges ?? [])

    updateForSource { $0.copy(buffered: buffered, readyState: readyState) }
    emit(.progress, ["buffered": buffered])
  }

  private func emitError(_ error: [String: Any]) {
    updateForSource { $0.copy(error: error) }
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
    var changed = false

    updateForSource {
      guard $0.contentData != next else { return $0 }

      changed = true
      return $0.copy(contentData: next)
    }

    if changed {
      hasContentData = !next.isEmpty
      emit(.contentdatachange)
    }
  }

  @objc
  private func handleItemDidPlayToEnd(_ notification: Notification) {
    onMainQueue(forNotification: notification) { engine in
      engine.atEnd = true
      engine.updateForSource { $0.copy(ended: true) }
      engine.emit(.ended)
    }
  }

  @objc
  private func handleItemFailedToPlayToEnd(_ notification: Notification) {
    let error = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? Error

    onMainQueue(forNotification: notification) { $0.emitError(playerError(from: error)) }
  }

  // KVO and notification delivery aren't guaranteed on the main queue, and
  // commands arrive from the JS thread, but the per-source bookkeeping and the
  // player are confined to it. Always dispatches, never runs inline, so player
  // work keeps the order its commands were issued in. Work dispatched before
  // `invalidate` runs ahead of it; anything later is dropped.
  private func onMainQueue(_ body: @escaping @MainActor (VideoJSPlayerEngine) -> Void) {
    DispatchQueue.main.async { [weak self] in
      guard let self, !invalidated else { return }

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

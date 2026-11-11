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

  // Not emitted yet: nothing can seek until the engine grows a seek command,
  // which is where these belong.
  case seeking
  case seeked

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

// HTMLMediaElement fires `timeupdate` every 15–250ms during playback.
private let timeUpdateInterval = CMTime(value: 1, timescale: 4)

/// One player behind one handle. Confined to the main queue — every entry point
/// is reached either from `VideoJSPlayerRegistry`'s main-queue dispatch or from
/// the Fabric surface, which is already on the main queue.
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

  /// Receives the `PlayerEvent` payload minus the handle the registry adds.
  private var onEvent: (([String: Any]) -> Void)?
  private var playerObservations: [NSKeyValueObservation] = []
  private var timeObserver: Any?
  private var invalidated = false

  // KVO reports the new status, not the transition, and the media events are
  // transitions — `play` is leaving paused, `playing` is entering playing.
  private var timeControlStatus: AVPlayer.TimeControlStatus = .paused

  // Per source; replaced when the source is swapped.
  private var item: AVPlayerItem?
  private var itemObservations: [NSKeyValueObservation] = []
  private var metadataLoaded = false
  private var duration = CMTime.invalid
  private var likelyToKeepUp = false

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
    timeObserver = player.addPeriodicTimeObserver(forInterval: timeUpdateInterval, queue: .main) { [weak self] time in
      guard let self, item != nil, time.isNumeric else { return }

      emit(.timeupdate, ["currentTime": time.seconds])
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

    if hadItem {
      emit(.emptied)
    }

    emit(.loadstart)

    // A media element fails an unusable src asynchronously rather than
    // rejecting it, so it reads as a load that errored.
    guard let next else {
      emit(.error, ["error": playerError(code: MediaErrorCode.srcNotSupported, message: "Invalid source URL: \(source)")])
      return
    }

    player.insert(next, after: nil)

    if wasPlaying {
      player.play()
    }
  }

  @objc
  public func play() {
    player.play()
  }

  @objc
  public func pause() {
    player.pause()
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
    duration = .invalid
    likelyToKeepUp = false
    canPlay = false

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
    case .failed:
      emit(.error, ["error": playerError(from: item.error)])
    default:
      break
    }
  }

  // Duration reads indefinite until the item is ready, which is
  // indistinguishable from live, so it only counts once metadata has loaded.
  private func syncDuration() {
    guard let item, metadataLoaded, item.duration != duration else { return }

    duration = item.duration
    emit(.durationchange, ["duration": duration.isIndefinite ? Double.infinity : duration.seconds])
  }

  // Gated on metadata so the load order matches a media element's:
  // `loadedmetadata`, `canplay`, `canplaythrough`.
  private func syncLikelyToKeepUp() {
    guard let item, metadataLoaded, item.isPlaybackLikelyToKeepUp != likelyToKeepUp else { return }

    likelyToKeepUp = item.isPlaybackLikelyToKeepUp

    if likelyToKeepUp {
      syncCanPlay(true)
      emit(.canplaythrough)
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
    guard let item else { return }

    let buffered = item.loadedTimeRanges
      .map(\.timeRangeValue)
      .sorted { $0.start < $1.start }
      .map { ["start": $0.start.seconds, "end": $0.end.seconds] }

    emit(.progress, ["buffered": buffered])
  }

  @objc
  private func handleItemDidPlayToEnd(_ notification: Notification) {
    onMainQueue(forNotification: notification) { $0.emit(.ended) }
  }

  @objc
  private func handleItemFailedToPlayToEnd(_ notification: Notification) {
    let error = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? Error

    onMainQueue(forNotification: notification) { $0.emit(.error, ["error": playerError(from: error)]) }
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

    onEvent?(values.merging(["type": type.jsName]) { _, type in type })
  }
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

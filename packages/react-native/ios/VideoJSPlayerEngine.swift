import AVFoundation
import Foundation

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

/// One player behind one handle, as a media element (POC: unidirectional).
///
/// The engine doesn't keep media element state or decide which events to fire.
/// It does two things, both on the main queue:
/// - **Report**: read AVPlayer's facts into `Reported` whenever KVO, a
///   notification or the periodic time observer says one may have moved.
/// - **Reconcile**: drive AVPlayer toward `Intent`.
///
/// Commands write `Intent` on the calling (JS) thread and dispatch a reconcile.
/// `MediaStore` derives the element state the getters read and the events to
/// fire from the two; see `VideoJSMediaModel.swift`.
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

  private var store: MediaStore!

  /// Receives each change as a bridge dictionary, minus the handle the
  /// registry adds.
  private var onChange: (([String: Any]) -> Void)?
  private var playerObservations: [NSKeyValueObservation] = []
  private var timeObserver: Any?
  private var invalidated = false

  // What reconcile has applied to the player, so far.
  private var appliedSourceGen = 0
  private var appliedSeekGen = 0
  private var settledSeekGen = 0

  // Per item; replaced when the item is. Facts AVPlayer reports only as
  // notifications or async loads, kept until the next report reads them.
  private var item: AVPlayerItem?
  private var itemObservations: [NSKeyValueObservation] = []
  private var atEnd = false
  private var itemError: MediaErrorValue?
  private var contentData = MediaContentData()

  @objc(initWithSource:onChange:)
  public init(source: String?, onChange: @escaping ([String: Any]) -> Void) {
    self.onChange = onChange

    super.init()

    // Changes are queued onto the main queue in write order, whichever thread
    // wrote, and delivered after the write that produced them, as a media
    // element's queued tasks are.
    store = MediaStore { [weak self] change in
      let payload = change.bridgeDictionary

      DispatchQueue.main.async {
        guard let self, !self.invalidated else { return }

        self.onChange?(payload)
      }
    }

    // The queue default advances past the finished item, leaving nothing to
    // render. Holding keeps the last frame up, matching ExoPlayer.
    player.actionAtItemEnd = .pause

    playerObservations.append(player.observe(\.timeControlStatus) { [weak self] _, _ in
      self?.onMainQueue { $0.report() }
    })

    // Also fires when playback starts or stops and when time jumps.
    timeObserver = player.addPeriodicTimeObserver(forInterval: timeUpdateInterval, queue: .main) { [weak self] _ in
      self?.report()
    }

    NotificationCenter.default.addObserver(
      self, selector: #selector(handleItemDidPlayToEnd(_:)), name: AVPlayerItem.didPlayToEndTimeNotification, object: nil
    )
    NotificationCenter.default.addObserver(
      self, selector: #selector(handleItemFailedToPlayToEnd(_:)),
      name: AVPlayerItem.failedToPlayToEndTimeNotification, object: nil
    )
    NotificationCenter.default.addObserver(
      self, selector: #selector(handleRateDidChange(_:)), name: AVPlayer.rateDidChangeNotification, object: player
    )

    if let source {
      _ = setSource(source)
    }
  }

  deinit {
    // The observers must be gone before the observed player is torn down, and
    // the player dies with us.
    invalidate()
  }

  // MARK: The media element — any thread
  //
  // Getters pass through to the store; each is its own read, so use
  // `readState()` to see several fields as of one moment.

  var currentTime: Double { store.read().currentTime }
  var duration: Double { store.read().duration }
  var buffered: [MediaTimeRange] { store.read().buffered }
  var seekable: [MediaTimeRange] { store.read().seekable }
  var error: MediaErrorValue? { store.read().error }
  var paused: Bool { store.read().paused }
  var ended: Bool { store.read().ended }
  var seeking: Bool { store.read().seeking }
  var currentSrc: String { store.read().currentSrc }
  var readyState: Int { store.read().readyState }
  var playbackRate: Double { store.read().playbackRate }

  func readState() -> MediaState { store.read() }

  /// All of the state as one update, for a mirror starting late.
  @objc
  public func readUpdate() -> [String: Any] { store.readUpdate().bridgeDictionary }

  // Commands. Each returns its own change, which the getters already reflect,
  // as a bridge dictionary the module hands straight back to JS.

  @objc(setSource:)
  public func setSource(_ source: String) -> [String: Any] { command { intent, _ in intent.settingSource(source) } }

  @objc
  public func load() -> [String: Any] { command { intent, _ in intent.loading() } }

  @objc
  public func play() -> [String: Any] { command { intent, state in intent.playing(state) } }

  @objc
  public func pause() -> [String: Any] { command { intent, _ in intent.pausing() } }

  @objc(setCurrentTime:)
  public func setCurrentTime(_ seconds: Double) -> [String: Any] {
    command { intent, state in intent.seeking(state, to: seconds) }
  }

  @objc(setPlaybackRate:)
  public func setPlaybackRate(_ rate: Double) -> [String: Any] { command { intent, _ in intent.settingPlaybackRate(rate) } }

  @objc(setLoop:)
  public func setLoop(_ loop: Bool) -> [String: Any] { command { intent, _ in intent.settingLoop(loop) } }

  private func command(_ transform: (Intent, MediaState) -> Intent) -> [String: Any] {
    let change = store.updateIntent(transform)

    onMainQueue { $0.reconcile() }

    return change.bridgeDictionary
  }

  // MARK: Reconcile — main queue

  private func reconcile() {
    let intent = store.readIntent()

    if intent.sourceGen != appliedSourceGen {
      appliedSourceGen = intent.sourceGen
      replaceItem(with: intent.src)
    }

    // AVPlayer can't seek an item until it's ready, so a seek waits for the
    // reconcile its readiness triggers. One against an older source is dropped.
    if intent.seekGen > appliedSeekGen {
      if intent.seekSourceGen != appliedSourceGen {
        appliedSeekGen = intent.seekGen
        settledSeekGen = intent.seekGen
      } else if let item, item.status == .readyToPlay {
        appliedSeekGen = intent.seekGen
        seek(item, to: intent.seekTarget, gen: intent.seekGen)
      }
    }

    player.actionAtItemEnd = intent.loop ? .none : .pause

    if #available(iOS 16, *) {
      player.defaultRate = Float(intent.playbackRate)
    }

    if intent.paused {
      player.pause()
    } else if player.rate == 0 || player.rate != Float(intent.playbackRate) {
      // `play()` starts at `defaultRate` from iOS 16, and at 1 before it.
      player.rate = Float(intent.playbackRate)
    }

    report()
  }

  // AVQueuePlayer documents replaceCurrentItem(with:) as unsupported, so the
  // swap goes through the queue.
  private func replaceItem(with source: String) {
    let next = source.isEmpty ? nil : URL(string: source).map { AVPlayerItem(url: $0) }

    player.removeAllItems()
    observe(next)

    // A media element fails an unusable src asynchronously rather than
    // rejecting it, so it reads as a load that errored.
    if !source.isEmpty, next == nil {
      itemError = playerError(code: MediaErrorCode.srcNotSupported, message: "Invalid source URL: \(source)")
    }

    if let next {
      player.insert(next, after: nil)
    }
  }

  // Superseded seeks complete unfinished and settle nothing.
  private func seek(_ item: AVPlayerItem, to seconds: Double, gen: Int) {
    atEnd = false

    player.seek(to: CMTime(seconds: seconds, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero) {
      [weak self] finished in
      guard finished else { return }

      self?.onMainQueue(for: item) { engine in
        engine.settledSeekGen = max(engine.settledSeekGen, gen)
        engine.report()
      }
    }
  }

  // MARK: Report — main queue

  private func report() {
    guard !invalidated else { return }

    let metadataKnown = item?.status == .readyToPlay
    let phase: EnginePhase = {
      guard let item, metadataKnown else { return .idle }
      if atEnd { return .ended }
      if player.timeControlStatus == .playing || item.isPlaybackLikelyToKeepUp || item.isPlaybackBufferFull {
        return .ready
      }
      return .buffering
    }()
    let now = player.currentTime()
    var adoptedPause = false

    store.transact { intent, reported, _ in
      reported = Reported(
        sourceGen: appliedSourceGen,
        seekGen: settledSeekGen,
        phase: phase,
        metadataKnown: metadataKnown,
        position: now.isNumeric ? now.seconds : 0,
        buffered: timeRanges(item?.loadedTimeRanges ?? []),
        duration: itemDuration(metadataKnown: metadataKnown),
        seekable: timeRanges(item?.seekableTimeRanges ?? []),
        error: itemError,
        contentData: contentData
      )

      // A media element pauses itself at the end; with `.pause` AVPlayer does
      // too, but the intent has to say so. Same write, so `pause` fires before
      // `ended`.
      if !intent.paused, derive(intent, reported).state.ended {
        intent = intent.pausing()
        adoptedPause = true
      }
    }

    if adoptedPause {
      onMainQueue { $0.reconcile() }
    }
  }

  // Duration reads indefinite until the item is ready, which is
  // indistinguishable from live, so it only counts once metadata has loaded.
  private func itemDuration(metadataKnown: Bool) -> Double {
    guard let item, metadataKnown else { return .nan }

    return item.duration.isIndefinite ? .infinity : item.duration.seconds
  }

  // Swaps the per-item observations and resets the per-item facts, so nothing
  // from the previous item is reported against the next.
  private func observe(_ next: AVPlayerItem?) {
    itemObservations.forEach { $0.invalidate() }
    itemObservations.removeAll()

    item = next
    atEnd = false
    itemError = nil
    contentData = MediaContentData()

    guard let next else { return }

    // Readiness is also when a waiting seek can go.
    itemObservations = [
      next.observe(\.status) { [weak self] item, _ in
        self?.onMainQueue(for: item) { engine in
          switch item.status {
          case .readyToPlay:
            engine.loadContentData(for: item)
            engine.reconcile()
          case .failed:
            engine.itemError = playerError(from: item.error)
            engine.report()
          default:
            engine.report()
          }
        }
      },
      next.observe(\.duration) { [weak self] item, _ in self?.onMainQueue(for: item) { $0.report() } },
      next.observe(\.loadedTimeRanges) { [weak self] item, _ in self?.onMainQueue(for: item) { $0.report() } },
      next.observe(\.isPlaybackLikelyToKeepUp) { [weak self] item, _ in self?.onMainQueue(for: item) { $0.report() } },
      // A live window slides with no media event to carry it.
      next.observe(\.seekableTimeRanges) { [weak self] item, _ in self?.onMainQueue(for: item) { $0.report() } },
    ]
  }

  // Asset metadata loads separately from the item, so it can land after a
  // source swap and is dropped if so.
  private func loadContentData(for item: AVPlayerItem) {
    Task { [weak self] in
      let loaded = await loadCommonContentData(from: item.asset)

      self?.onMainQueue(for: item) { engine in
        engine.contentData = MediaContentData(title: loaded["title"], poster: loaded["poster"])
        engine.report()
      }
    }
  }

  @objc
  private func handleItemDidPlayToEnd(_ notification: Notification) {
    onMainQueue(forNotification: notification) { engine in
      // A looping media element starts over instead of ending; the periodic
      // observer reports the jump back.
      if engine.store.readIntent().loop {
        engine.player.seek(to: .zero)
        return
      }

      engine.atEnd = true
      engine.report()
    }
  }

  @objc
  private func handleItemFailedToPlayToEnd(_ notification: Notification) {
    let error = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? Error

    onMainQueue(forNotification: notification) { engine in
      engine.itemError = playerError(from: error)
      engine.report()
    }
  }

  // Reconcile's own rate changes are `setRateCalled`. An interruption or
  // backgrounding is the platform pausing, which a media element reports as
  // paused.
  @objc
  private func handleRateDidChange(_ notification: Notification) {
    guard
      let reason = notification.userInfo?[AVPlayer.rateDidChangeReasonKey] as? AVPlayer.RateDidChangeReason,
      reason == .audioSessionInterrupted || reason == .appBackgrounded
    else { return }

    onMainQueue { engine in
      guard engine.player.rate == 0 else { return }

      engine.store.updateIntent { intent, _ in intent.pausing() }
    }
  }

  // MARK: Surfaces and teardown

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

    store?.reset()
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

    onChange = nil
  }

  // Only one layer may draw a given player, so the top of the stack takes it
  // and everything below is cleared.
  private func repointLayers() {
    let top = layers.last

    for layer in layers {
      layer.player = layer === top ? player : nil
    }
  }

  // KVO and notification delivery aren't guaranteed on the main queue, and
  // commands arrive from the JS thread, but the per-item facts and the player
  // are confined to it. Always dispatches, never runs inline, so player work
  // keeps the order its commands were issued in. Work dispatched before
  // `invalidate` runs ahead of it; anything later is dropped.
  private func onMainQueue(_ body: @escaping (VideoJSPlayerEngine) -> Void) {
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
}

// MARK: Bridge serialization

extension MediaChange {
  /// `PlayerUpdate` in `src/media/NativeEngineStore.ts`.
  var bridgeDictionary: [String: Any] {
    [
      "version": Double(version),
      "patch": patch.mapValues(\.bridgeValue),
      "events": events.map(\.jsName),
    ]
  }
}

extension PatchValue {
  var bridgeValue: Any {
    switch self {
    case let .number(value): value
    case let .int(value): value
    case let .bool(value): value
    case let .string(value): value
    case let .ranges(ranges): ranges.map { ["start": $0.start, "end": $0.end] }
    case let .error(error): error.map { ["code": $0.code, "message": $0.message] as [String: Any] } ?? NSNull()
    case let .contentData(data): ["title": data.title, "poster": data.poster].compactMapValues { $0 }
    }
  }
}

private func timeRanges(_ values: [NSValue]) -> [MediaTimeRange] {
  values
    .map(\.timeRangeValue)
    .sorted { $0.start < $1.start }
    .map { MediaTimeRange(start: $0.start.seconds, end: $0.end.seconds) }
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

private func playerError(code: Int, message: String) -> MediaErrorValue {
  MediaErrorValue(code: code, message: message)
}

private func playerError(from error: Error?) -> MediaErrorValue {
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

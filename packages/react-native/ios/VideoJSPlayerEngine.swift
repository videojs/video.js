import AVFoundation
import Foundation

/// Mirrors `PlayerEvent['type']` in `src/media/NativeEngineStore.ts`.
@objc(VideoJSPlayerEventType)
public enum VideoJSPlayerEventType: Int {
  case playing
  case pause
  case ended

  var jsName: String {
    switch self {
    case .playing: "playing"
    case .pause: "pause"
    case .ended: "ended"
    }
  }
}

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

  private var onEvent: ((VideoJSPlayerEventType) -> Void)?
  private var timeControlObservation: NSKeyValueObservation?
  private var invalidated = false

  // AVPlayer has three time-control states but the JS contract has two, so
  // collapsing them can emit the same value twice (paused → buffering). Track
  // the last one to match ExoPlayer's change-only semantics.
  private var lastType: VideoJSPlayerEventType?

  /// A nil source leaves the player idle until `setSource(_:)` supplies one.
  @objc(initWithSource:onEvent:)
  public init(source: String?, onEvent: @escaping (VideoJSPlayerEventType) -> Void) {
    self.onEvent = onEvent

    super.init()

    // The queue default advances past the finished item, leaving nothing to
    // render. Holding keeps the last frame up, matching ExoPlayer.
    player.actionAtItemEnd = .pause

    // Buffering reports as not-playing, which is what ExoPlayer's `isPlaying`
    // does too.
    timeControlObservation = player.observe(\.timeControlStatus, options: [.new]) { [weak self] player, _ in
      let type: VideoJSPlayerEventType = player.timeControlStatus == .playing ? .playing : .pause
      self?.emitOnMainQueue(type)
    }

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleItemDidPlayToEnd(_:)),
      name: AVPlayerItem.didPlayToEndTimeNotification,
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

  /// JS name for an event type; Swift enums can't carry methods across to
  /// Objective-C.
  @objc(jsNameForEventType:)
  public static func jsName(for type: VideoJSPlayerEventType) -> String {
    type.jsName
  }

  // AVQueuePlayer documents replaceCurrentItem(with:) as unsupported, so the
  // swap goes through the queue. removeAllItems drops the rate, so a player
  // that was playing is restarted to match ExoPlayer's surviving
  // `playWhenReady`.
  @objc(setSource:)
  public func setSource(_ source: String) {
    let item = URL(string: source).map { AVPlayerItem(url: $0) }
    let wasPlaying = player.timeControlStatus != .paused

    player.removeAllItems()

    guard let item else { return }

    player.insert(item, after: nil)

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

    timeControlObservation?.invalidate()
    timeControlObservation = nil
    NotificationCenter.default.removeObserver(self)

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

  @objc
  private func handleItemDidPlayToEnd(_ notification: Notification) {
    DispatchQueue.main.async { [weak self] in
      // The notification is unfiltered, so ignore items belonging to other
      // engines.
      guard let self, let item = notification.object as? AVPlayerItem, item === player.currentItem else {
        return
      }

      emit(.ended)
    }
  }

  // KVO and notification delivery aren't guaranteed on the main queue, but the
  // dedupe state and the player are.
  private func emitOnMainQueue(_ type: VideoJSPlayerEventType) {
    DispatchQueue.main.async { [weak self] in
      self?.emit(type)
    }
  }

  private func emit(_ type: VideoJSPlayerEventType) {
    if invalidated || lastType == type { return }

    lastType = type
    onEvent?(type)
  }
}

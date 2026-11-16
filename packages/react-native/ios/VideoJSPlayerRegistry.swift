import Foundation

/// Owns the engines addressed by handle, shared between the control TurboModule
/// and the Fabric surface so neither has to reach through the other. A
/// singleton because a Fabric component view is built by the mounting layer
/// with no way to inject the module that created the engine.
///
/// `createPlayer` is a synchronous method, so it lands on the JS thread while
/// the players are confined to the main queue. Handle allocation happens on the
/// caller's thread (cheap, locked) and every engine touch is dispatched to the
/// main queue. Because dispatches are FIFO, a command issued in the same tick
/// as `createPlayer` runs after construction rather than against a missing
/// engine — the queueing the design requires falls out of the queue.
@objc
public final class VideoJSPlayerRegistry: NSObject {
  @objc(sharedRegistry)
  public static let shared = VideoJSPlayerRegistry()

  @objc
  public var onEvent: ((Int, VideoJSPlayerEventType) -> Void)?

  /// Main queue only.
  private var engines: [Int: VideoJSPlayerEngine] = [:]

  private let handleLock = NSLock()
  private var lastHandle = 0

  override private init() {
    super.init()
  }

  @objc(createPlayerWithSource:)
  public func createPlayer(source: String?) -> Int {
    // Allocated from 1, so the 0 the Fabric props default to is unambiguously
    // "no player".
    handleLock.lock()
    lastHandle += 1
    let handle = lastHandle
    handleLock.unlock()

    onMainQueue { [weak self] in
      guard let self else { return }

      engines[handle] = VideoJSPlayerEngine(source: source) { [weak self] type in
        self?.onEvent?(handle, type)
      }
    }

    return handle
  }

  @objc(destroyPlayer:)
  public func destroyPlayer(_ handle: Int) {
    onMainQueue { [weak self] in
      self?.engines.removeValue(forKey: handle)?.invalidate()
    }
  }

  @objc(commandPlayer:block:)
  public func commandPlayer(_ handle: Int, block: @escaping (VideoJSPlayerEngine) -> Void) {
    onMainQueue { [weak self] in
      if let engine = self?.engine(forHandle: handle) {
        block(engine)
      }
    }
  }

  /// Synchronous lookup for the Fabric surface. Safe because the surface only
  /// mounts after `createPlayer` returned, so the construction dispatch is
  /// already ahead of it in the main queue.
  @objc(engineForHandle:)
  public func engine(forHandle handle: Int) -> VideoJSPlayerEngine? {
    engines[handle]
  }

  @objc
  public func releaseAll() {
    onMainQueue { [weak self] in
      guard let self else { return }

      for engine in engines.values {
        engine.invalidate()
      }

      engines.removeAll()
    }
  }

  // Always dispatches, never runs inline on the main queue — inlining would let
  // a command overtake a still-queued construction.
  private func onMainQueue(_ block: @escaping () -> Void) {
    DispatchQueue.main.async(execute: block)
  }
}

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
  public var onEvent: ((Int, [String: Any]) -> Void)?

  // Guards the handle counter and the engine map. Engines are added and
  // removed on the main queue, but the synchronous getters look them up from
  // the JS thread; each engine guards its own state.
  private let lock = NSLock()
  private var lastHandle = 0
  private var engines: [Int: VideoJSPlayerEngine] = [:]

  override private init() {
    super.init()
  }

  @objc(createPlayerWithSource:)
  public func createPlayer(source: String?) -> Int {
    // Allocated from 1, so the 0 the Fabric props default to is unambiguously
    // "no player".
    let handle = lock.withLock {
      lastHandle += 1
      return lastHandle
    }

    onMainQueue { [weak self] in
      guard let self else { return }

      let engine = VideoJSPlayerEngine(source: source) { [weak self] event in
        self?.onEvent?(handle, event)
      }

      lock.withLock { self.engines[handle] = engine }
    }

    return handle
  }

  @objc(destroyPlayer:)
  public func destroyPlayer(_ handle: Int) {
    onMainQueue { [weak self] in
      guard let self else { return }

      lock.withLock { self.engines.removeValue(forKey: handle) }?.invalidate()
    }
  }

  /// A command that changes state: `request` writes the state it will produce,
  /// from the calling thread so getters reflect it at once, then `block` runs
  /// on the main queue. Before the engine exists there is nothing to write to
  /// yet, so the request runs on the main queue just ahead of `block` instead.
  ///
  /// Returns whether the request ran on the calling thread.
  @objc(commandPlayer:request:block:)
  @discardableResult
  public func commandPlayer(
    _ handle: Int,
    request: @escaping (VideoJSPlayerEngine) -> Void,
    block: @escaping (VideoJSPlayerEngine) -> Void
  ) -> Bool {
    let engine = engine(forHandle: handle)

    engine.map(request)

    onMainQueue { [weak self] in
      guard let current = self?.engine(forHandle: handle) else { return }

      if engine == nil {
        request(current)
      }

      block(current)
    }

    return engine != nil
  }

  /// The latest published state, from any thread. A handle whose engine
  /// doesn't exist — not built yet, or destroyed — reads as a fresh player.
  @objc(stateForHandle:)
  public func state(forHandle handle: Int) -> VideoJSPlayerState {
    engine(forHandle: handle)?.readState() ?? .initial
  }

  /// Synchronous lookup for the Fabric surface. Safe because the surface only
  /// mounts after `createPlayer` returned, so the construction dispatch is
  /// already ahead of it in the main queue.
  @objc(engineForHandle:)
  public func engine(forHandle handle: Int) -> VideoJSPlayerEngine? {
    lock.withLock { engines[handle] }
  }

  @objc
  public func releaseAll() {
    onMainQueue { [weak self] in
      guard let self else { return }

      let released = lock.withLock {
        defer { self.engines.removeAll() }
        return Array(self.engines.values)
      }

      for engine in released {
        engine.invalidate()
      }
    }
  }

  // Always dispatches, never runs inline on the main queue — inlining would let
  // a command overtake a still-queued construction.
  private func onMainQueue(_ block: @escaping () -> Void) {
    DispatchQueue.main.async(execute: block)
  }
}

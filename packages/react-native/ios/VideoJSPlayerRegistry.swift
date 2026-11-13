import Foundation

/// Owns the engines addressed by handle, shared between the control TurboModule
/// and the Fabric surface so neither has to reach through the other. A
/// singleton because a Fabric component view is built by the mounting layer
/// with no way to inject the module that created the engine.
///
/// `createPlayer` and the commands are synchronous methods, so they land on the
/// JS thread. The engine is built there, before `createPlayer` returns, so a
/// command issued in the same tick finds it; each engine dispatches its own
/// player work to the main queue.
@objc
public final class VideoJSPlayerRegistry: NSObject {
  @objc(sharedRegistry)
  public static let shared = VideoJSPlayerRegistry()

  /// Each engine's changes as bridge dictionaries, tagged by handle.
  @objc
  public var onChange: ((Int, [String: Any]) -> Void)?

  // Guards the handle counter and the engine map, which the JS thread writes
  // and the main queue reads for the Fabric surface; each engine guards its
  // own state.
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

    let engine = VideoJSPlayerEngine(source: source) { [weak self] change in
      self?.onChange?(handle, change)
    }

    lock.withLock { engines[handle] = engine }

    return handle
  }

  /// Unreachable by handle at once; invalidated on the main queue behind any
  /// player work its commands already dispatched. The dispatch holds the last
  /// reference, so the engine is also released there.
  @objc(destroyPlayer:)
  public func destroyPlayer(_ handle: Int) {
    guard let engine = lock.withLock({ engines.removeValue(forKey: handle) }) else { return }

    DispatchQueue.main.async { engine.invalidate() }
  }

  /// From any thread. Nil once the handle is destroyed, so a command for it
  /// does nothing.
  @objc(engineForHandle:)
  public func engine(forHandle handle: Int) -> VideoJSPlayerEngine? {
    lock.withLock { engines[handle] }
  }

  /// All of the latest state as one update, from any thread. A destroyed
  /// handle reads as a fresh player.
  @objc(updateForHandle:)
  public func update(forHandle handle: Int) -> [String: Any] {
    engine(forHandle: handle)?.readUpdate() ?? MediaChange(version: 0, patch: patch(nil, MediaState()), events: []).bridgeDictionary
  }

  @objc
  public func releaseAll() {
    for handle in lock.withLock({ Array(engines.keys) }) {
      destroyPlayer(handle)
    }
  }
}

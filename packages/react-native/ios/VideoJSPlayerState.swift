import Foundation

/// One player's state as an `HTMLMediaElement` would report it, property for
/// property. Immutable: `VideoJSPlayerEngine` publishes a whole new snapshot
/// rather than editing one, so a reader never sees half an update. `initial`
/// holds a media element's initial values, which is also what a reset restores.
///
/// A class rather than a struct so the Objective-C++ module can read it.
@objc(VideoJSPlayerState)
public final class VideoJSPlayerState: NSObject {
  @objc public static let initial = VideoJSPlayerState()

  /// Seconds.
  @objc public let currentTime: Double
  /// Seconds; NaN until known, infinite for live.
  @objc public let duration: Double
  /// `{ start, end }` in seconds, ascending.
  @objc public let buffered: [[String: Double]]
  @objc public let seekable: [[String: Double]]
  /// `{ code, message }`, where `code` is a `MediaError` code.
  @objc public let error: [String: Any]?
  @objc public let paused: Bool
  @objc public let ended: Bool
  @objc public let seeking: Bool
  @objc public let currentSrc: String
  @objc public let readyState: Int
  @objc public let playbackRate: Double
  @objc public let contentData: [String: String]

  init(
    currentTime: Double = 0,
    duration: Double = .nan,
    buffered: [[String: Double]] = [],
    seekable: [[String: Double]] = [],
    error: [String: Any]? = nil,
    paused: Bool = true,
    ended: Bool = false,
    seeking: Bool = false,
    currentSrc: String = "",
    readyState: Int = 0,
    playbackRate: Double = 1,
    contentData: [String: String] = [:]
  ) {
    self.currentTime = currentTime
    self.duration = duration
    self.buffered = buffered
    self.seekable = seekable
    self.error = error
    self.paused = paused
    self.ended = ended
    self.seeking = seeking
    self.currentSrc = currentSrc
    self.readyState = readyState
    self.playbackRate = playbackRate
    self.contentData = contentData
  }
}

import Foundation

// POC: the media element as unidirectional data flow. A port of
// `android/.../MediaModel.kt`; keep the two in step.
//
//   commands ──► Intent ───┐
//                          ├─► derive() ──► MediaState ──► diff() ──► events
//   engine ────► Reported ─┘                   │
//      ▲                                       └─► getters
//      └──────── reconcile(Intent) ◄── engine side
//
// `Intent` is what JS asked for; `Reported` is what the engine says. Neither
// holds media element state: `readyState`, `seeking`, `ended`, … are derived,
// and every event is a difference between two derived states. Nothing here
// knows about AVPlayer.

/// Mirrors `PlayerEventType` in `src/media/NativeEngineStore.ts`.
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

/// `HTMLMediaElement.readyState` values.
enum ReadyState {
  static let haveNothing = 0
  static let haveMetadata = 1
  static let haveCurrentData = 2
  static let haveFutureData = 3
  static let haveEnoughData = 4
}

struct MediaTimeRange: Equatable {
  /// Seconds.
  var start: Double
  var end: Double
}

/// `code` is a `MediaError` code.
struct MediaErrorValue: Equatable {
  var code: Int
  var message: String
}

/// A key is nil unless the content supplies it.
struct MediaContentData: Equatable {
  var title: String?
  /// A URL, or a `data:` URI when the content embeds the artwork.
  var poster: String?
}

/// One player's state as an `HTMLMediaElement` would report it, property for
/// property. The defaults are a media element's initial values.
struct MediaState: Equatable {
  var currentTime: Double = 0
  /// NaN until known, infinite for live.
  var duration: Double = .nan
  var buffered: [MediaTimeRange] = []
  var seekable: [MediaTimeRange] = []
  var error: MediaErrorValue?
  var paused = true
  var ended = false
  var seeking = false
  var currentSrc = ""
  var readyState = ReadyState.haveNothing
  var playbackRate: Double = 1
  var contentData = MediaContentData()

  // NaN never equals itself, which would make every derived state "changed".
  static func == (a: MediaState, b: MediaState) -> Bool {
    sameNumber(a.currentTime, b.currentTime) && sameNumber(a.duration, b.duration) && a.buffered == b.buffered
      && a.seekable == b.seekable && a.error == b.error && a.paused == b.paused && a.ended == b.ended
      && a.seeking == b.seeking && a.currentSrc == b.currentSrc && a.readyState == b.readyState
      && a.playbackRate == b.playbackRate && a.contentData == b.contentData
  }
}

enum EnginePhase { case idle, buffering, ready, ended }

/// What JS asked for. Commands write it on the JS thread. The engine writes it
/// only where a media element changes it itself (reaching the end, an audio
/// session interruption) — see `MediaStore.transact`.
///
/// Generations, not values, tie the engine's reports to the commands they
/// answer: seeking to the same time twice, or reloading the same `src`, is
/// still a new command.
struct Intent {
  var src = ""
  var sourceGen = 0
  var paused = true
  var seekGen = 0
  /// The source generation `seekGen` was issued against; a newer source drops it.
  var seekSourceGen = 0
  var seekTarget: Double = 0
  var playbackRate: Double = 1
  var loop = false
}

/// What the engine says. Only the engine writes it, on the main queue.
struct Reported {
  /// The source generation these facts belong to.
  var sourceGen = 0
  /// The newest seek generation the engine has finished.
  var seekGen = 0
  var phase = EnginePhase.idle
  var metadataKnown = false
  var position: Double = 0
  /// Ascending, non-overlapping; whatever the engine knows.
  var buffered: [MediaTimeRange] = []
  var duration: Double = .nan
  var seekable: [MediaTimeRange] = []
  var error: MediaErrorValue?
  var contentData = MediaContentData()
}

/// `MediaState` plus what `diff` needs to tell transitions apart.
struct MediaSnapshot {
  var state: MediaState
  var sourceGen: Int
  var seekGen: Int
  /// Playback requested but starved: what `waiting` marks the start of.
  var starved: Bool
  /// Playback requested and possible: what `playing` marks the start of.
  var playing: Bool
}

func derive(_ intent: Intent, _ reported: Reported) -> MediaSnapshot {
  let hasSource = !intent.src.isEmpty
  // Facts about an older source never leak into the current one.
  let r = hasSource && reported.sourceGen == intent.sourceGen ? reported : Reported()

  // JS wins: a seek owns `currentTime` from the moment it's issued until the
  // engine reports that generation finished.
  let seeking = hasSource && intent.seekSourceGen == intent.sourceGen && intent.seekGen > reported.seekGen
  let ended = !seeking && !intent.loop && r.phase == .ended
  let readyState: Int = {
    if !r.metadataKnown { return ReadyState.haveNothing }
    if r.phase == .ready || r.phase == .ended { return ReadyState.haveEnoughData }
    if r.phase == .buffering, r.buffered.contains(where: { $0.start <= r.position && $0.end > r.position }) {
      return ReadyState.haveCurrentData
    }
    return ReadyState.haveMetadata
  }()
  let requested = !intent.paused && !ended && r.error == nil

  let state = MediaState(
    currentTime: seeking ? intent.seekTarget : r.position,
    duration: r.metadataKnown ? r.duration : .nan,
    buffered: r.buffered,
    seekable: r.seekable,
    error: r.error,
    paused: intent.paused,
    ended: ended,
    seeking: seeking,
    currentSrc: intent.src,
    readyState: readyState,
    playbackRate: intent.playbackRate,
    contentData: r.contentData
  )

  return MediaSnapshot(
    state: state,
    sourceGen: intent.sourceGen,
    seekGen: intent.seekGen,
    starved: requested && readyState < ReadyState.haveFutureData,
    playing: requested && readyState >= ReadyState.haveFutureData && !seeking
  )
}

/// The events a media element fires going from `prev` to `next`, in its order.
/// This is the only place events come from.
func diff(_ prev: MediaSnapshot, _ next: MediaSnapshot) -> [VideoJSPlayerEventType] {
  var events: [VideoJSPlayerEventType] = []
  let n = next.state
  let newSource = next.sourceGen != prev.sourceGen

  // A new source compares against a fresh element, so its load reads as the
  // full sequence even when several steps land in one write.
  var base = prev

  if newSource {
    var fresh = Intent()
    fresh.src = n.currentSrc
    fresh.sourceGen = next.sourceGen
    fresh.paused = prev.state.paused
    fresh.playbackRate = prev.state.playbackRate
    base = derive(fresh, Reported())
    base.seekGen = next.seekGen
  }

  let p = base.state

  // The load algorithm: the old source empties (resetting the position fires
  // `timeupdate`), then the new one starts loading.
  if newSource, !prev.state.currentSrc.isEmpty {
    events.append(.emptied)
    if prev.state.currentTime != 0 { events.append(.timeupdate) }
    if prev.state.contentData != MediaContentData() { events.append(.contentdatachange) }
  }
  if newSource, !n.currentSrc.isEmpty { events.append(.loadstart) }

  if p.error == nil, n.error != nil { events.append(.error) }
  if p.paused, !n.paused { events.append(.play) }
  // A seek issued while another is in flight fires `seeking` again, as on the web.
  if n.seeking, next.seekGen != base.seekGen { events.append(.seeking) }
  if p.currentTime != n.currentTime { events.append(.timeupdate) }
  if p.seeking, !n.seeking { events.append(.seeked) }
  if !p.paused, n.paused { events.append(.pause) }
  if !sameNumber(p.duration, n.duration) { events.append(.durationchange) }

  // The spec's ready-state transition table.
  if p.readyState < ReadyState.haveMetadata, n.readyState >= ReadyState.haveMetadata { events.append(.loadedmetadata) }
  if p.readyState < ReadyState.haveFutureData, n.readyState >= ReadyState.haveFutureData { events.append(.canplay) }
  if p.readyState < ReadyState.haveEnoughData, n.readyState == ReadyState.haveEnoughData { events.append(.canplaythrough) }

  if !base.playing, next.playing { events.append(.playing) }
  if !base.starved, next.starved { events.append(.waiting) }
  // Ends, not ranges: a range that starts at the playhead moves with playback
  // without anything new having loaded.
  if p.buffered.map(\.end) != n.buffered.map(\.end) { events.append(.progress) }
  if p.playbackRate != n.playbackRate { events.append(.ratechange) }
  if !p.ended, n.ended { events.append(.ended) }
  if p.contentData != n.contentData { events.append(.contentdatachange) }

  return events
}

// Commands: what each one means as intent, given the state it was issued in.
// The engine turns intent into player calls separately (reconcile), so these
// are synchronous and the getters reflect them immediately.
extension Intent {
  func settingSource(_ src: String) -> Intent {
    var next = self
    next.src = src
    next.sourceGen += 1
    return next
  }

  func loading() -> Intent {
    guard !src.isEmpty else { return self }

    var next = self
    next.sourceGen += 1
    return next
  }

  // Playing after the end restarts from the beginning, which is a seek.
  func playing(_ state: MediaState) -> Intent {
    var next = self
    next.paused = false
    return state.ended ? next.seeking(state, to: state.seekable.first?.start ?? 0) : next
  }

  func pausing() -> Intent {
    var next = self
    next.paused = true
    return next
  }

  func seeking(_ state: MediaState, to seconds: Double) -> Intent {
    guard !src.isEmpty else { return self }

    var next = self
    next.seekGen += 1
    next.seekSourceGen = sourceGen
    next.seekTarget = clampToSeekable(seconds, state.seekable)
    return next
  }

  func settingPlaybackRate(_ rate: Double) -> Intent {
    guard rate > 0 else { return self }

    var next = self
    next.playbackRate = rate
    return next
  }

  func settingLoop(_ loop: Bool) -> Intent {
    var next = self
    next.loop = loop
    return next
  }
}

/// Where a seek to `seconds` lands: the nearest seekable position, or as asked
/// when nothing is seekable yet.
func clampToSeekable(_ seconds: Double, _ seekable: [MediaTimeRange]) -> Double {
  guard !seekable.isEmpty else { return max(seconds, 0) }

  return seekable
    .map { min(max(seconds, $0.start), $0.end) }
    .min { abs($0 - seconds) < abs($1 - seconds) }!
}

private func sameNumber(_ a: Double, _ b: Double) -> Bool { a == b || (a.isNaN && b.isNaN) }

/// One field's new value, by `HTMLMediaElement` property name.
enum PatchValue: Equatable {
  case number(Double)
  case int(Int)
  case bool(Bool)
  case string(String)
  case ranges([MediaTimeRange])
  case error(MediaErrorValue?)
  case contentData(MediaContentData)

  static func == (a: PatchValue, b: PatchValue) -> Bool {
    switch (a, b) {
    case let (.number(x), .number(y)): sameNumber(x, y)
    case let (.int(x), .int(y)): x == y
    case let (.bool(x), .bool(y)): x == y
    case let (.string(x), .string(y)): x == y
    case let (.ranges(x), .ranges(y)): x == y
    case let (.error(x), .error(y)): x == y
    case let (.contentData(x), .contentData(y)): x == y
    default: false
    }
  }
}

/// One write's worth of change, for a mirror across the thread hop: the fields
/// that changed, then the events announcing them. See `PlayerUpdate` in
/// `src/media/NativeEngineStore.ts` for how `version` orders them.
struct MediaChange {
  var version: Int64
  var patch: [String: PatchValue]
  var events: [VideoJSPlayerEventType]

  var isEmpty: Bool { patch.isEmpty && events.isEmpty }
}

/// The fields of `next` that differ from `prev`; all of them with no `prev`.
func patch(_ prev: MediaState?, _ next: MediaState) -> [String: PatchValue] {
  let fields: [(String, PatchValue, PatchValue?)] = [
    ("currentTime", .number(next.currentTime), prev.map { .number($0.currentTime) }),
    ("duration", .number(next.duration), prev.map { .number($0.duration) }),
    ("buffered", .ranges(next.buffered), prev.map { .ranges($0.buffered) }),
    ("seekable", .ranges(next.seekable), prev.map { .ranges($0.seekable) }),
    ("error", .error(next.error), prev.map { .error($0.error) }),
    ("paused", .bool(next.paused), prev.map { .bool($0.paused) }),
    ("ended", .bool(next.ended), prev.map { .bool($0.ended) }),
    ("seeking", .bool(next.seeking), prev.map { .bool($0.seeking) }),
    ("currentSrc", .string(next.currentSrc), prev.map { .string($0.currentSrc) }),
    ("readyState", .int(next.readyState), prev.map { .int($0.readyState) }),
    ("playbackRate", .number(next.playbackRate), prev.map { .number($0.playbackRate) }),
    ("contentData", .contentData(next.contentData), prev.map { .contentData($0.contentData) }),
  ]

  var result: [String: PatchValue] = [:]

  for (key, value, previous) in fields where value != previous {
    result[key] = value
  }

  return result
}

/// Holds `Intent` and `Reported` under one lock. Every write derives the next
/// state, diffs it against the last, and versions the result in the same
/// critical section, so getters, patches and events agree, and changes reach
/// `emit` in write order whichever thread wrote.
///
/// `emit` runs inside the lock; it should queue, not dispatch.
final class MediaStore {
  private let lock = NSLock()
  private let emit: (MediaChange) -> Void
  private var intent = Intent()
  private var reported = Reported()
  private var snapshot = derive(Intent(), Reported())
  private var version: Int64 = 0

  init(emit: @escaping (MediaChange) -> Void) {
    self.emit = emit
  }

  /// Any thread. What the getters report.
  func read() -> MediaState { lock.withLock { snapshot.state } }

  func readIntent() -> Intent { lock.withLock { intent } }

  /// Any thread. All of the state, at the version it was last written at.
  func readUpdate() -> MediaChange {
    lock.withLock { MediaChange(version: version, patch: patch(nil, snapshot.state), events: []) }
  }

  /// Any thread. Writes either input or both as one step, so their events come
  /// out in one diff. The block gets the state as of before the write.
  @discardableResult
  func transact(_ block: (inout Intent, inout Reported, MediaState) -> Void) -> MediaChange {
    lock.withLock {
      var nextIntent = intent
      var nextReported = reported

      block(&nextIntent, &nextReported, snapshot.state)

      let next = derive(nextIntent, nextReported)
      let change = MediaChange(version: version + 1, patch: patch(snapshot.state, next.state), events: diff(snapshot, next))

      intent = nextIntent
      reported = nextReported
      snapshot = next

      if change.isEmpty { return change }

      version = change.version
      emit(change)

      return change
    }
  }

  @discardableResult
  func updateIntent(_ transform: (Intent, MediaState) -> Intent) -> MediaChange {
    transact { intent, _, state in intent = transform(intent, state) }
  }

  @discardableResult
  func updateReported(_ transform: (Reported) -> Reported) -> MediaChange {
    transact { _, reported, _ in reported = transform(reported) }
  }

  /// Back to a fresh element, without events: nothing is listening any more.
  func reset() {
    lock.withLock {
      intent = Intent()
      reported = Reported()
      snapshot = derive(intent, reported)
    }
  }
}

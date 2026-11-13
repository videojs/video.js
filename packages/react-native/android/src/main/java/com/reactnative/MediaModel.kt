package com.reactnative

// POC: the media element as unidirectional data flow.
//
//   commands ──► Intent ───┐
//                          ├─► derive() ──► PlayerState ──► diff() ──► events
//   engine ────► Reported ─┘                   │
//      ▲                                       └─► getters
//      └──────── reconcile(Intent) ◄── engine side
//
// `Intent` is what JS asked for; `Reported` is what the engine says. Neither
// holds media element state: `readyState`, `seeking`, `ended`, … are derived,
// and every event is a difference between two derived states. Nothing here
// knows about ExoPlayer, so the same file can sit behind AVPlayer, and both
// platforms can run the same test vectors.

/** `HTMLMediaElement.readyState` values. */
internal object ReadyState {
  const val HAVE_NOTHING = 0
  const val HAVE_METADATA = 1
  const val HAVE_CURRENT_DATA = 2
  const val HAVE_FUTURE_DATA = 3
  const val HAVE_ENOUGH_DATA = 4
}

internal enum class EnginePhase { IDLE, BUFFERING, READY, ENDED }

/**
 * What JS asked for. Commands write it on the JS thread. The engine writes it
 * only where a media element changes it itself (reaching the end, losing audio
 * focus) — see [MediaStore.transact].
 *
 * Generations, not values, tie the engine's reports to the commands they
 * answer: seeking to the same time twice, or reloading the same `src`, is still
 * a new command.
 */
internal data class Intent(
  val src: String = "",
  val sourceGen: Int = 0,
  val paused: Boolean = true,
  val seekGen: Int = 0,
  /** The source generation [seekGen] was issued against; a newer source drops it. */
  val seekSourceGen: Int = 0,
  val seekTarget: Double = 0.0,
  val playbackRate: Double = 1.0,
  val loop: Boolean = false,
)

/** What the engine says. Only the engine writes it, on its own thread. */
internal data class Reported(
  /** The source generation these facts belong to. */
  val sourceGen: Int = 0,
  /** The newest seek generation the engine has finished. */
  val seekGen: Int = 0,
  val phase: EnginePhase = EnginePhase.IDLE,
  val metadataKnown: Boolean = false,
  val position: Double = 0.0,
  /** Ascending, non-overlapping; whatever the engine knows, which may be less than a media element would. */
  val buffered: List<PlayerTimeRange> = emptyList(),
  val duration: Double = Double.NaN,
  val seekable: List<PlayerTimeRange> = emptyList(),
  val error: PlayerError? = null,
  val contentData: PlayerContentData = PlayerContentData(),
)

/** [PlayerState] plus what [diff] needs to tell transitions apart. */
internal data class MediaSnapshot(
  val state: PlayerState,
  val sourceGen: Int,
  val seekGen: Int,
  /** Playback requested but starved: what `waiting` marks the start of. */
  val starved: Boolean,
  /** Playback requested and possible: what `playing` marks the start of. */
  val playing: Boolean,
)

internal fun derive(intent: Intent, reported: Reported): MediaSnapshot {
  val hasSource = intent.src.isNotEmpty()
  // Facts about an older source never leak into the current one.
  val r = if (hasSource && reported.sourceGen == intent.sourceGen) reported else Reported()

  // JS wins: a seek owns `currentTime` from the moment it's issued until the
  // engine reports that generation finished.
  val seeking = hasSource && intent.seekSourceGen == intent.sourceGen && intent.seekGen > reported.seekGen
  val ended = !seeking && !intent.loop && r.phase == EnginePhase.ENDED
  val readyState =
    when {
      !r.metadataKnown -> ReadyState.HAVE_NOTHING
      r.phase == EnginePhase.READY || r.phase == EnginePhase.ENDED -> ReadyState.HAVE_ENOUGH_DATA
      r.phase == EnginePhase.BUFFERING && r.buffered.any { it.start <= r.position && it.end > r.position } ->
        ReadyState.HAVE_CURRENT_DATA
      else -> ReadyState.HAVE_METADATA
    }
  val requested = !intent.paused && !ended && r.error == null

  val state =
    PlayerState(
      currentTime = if (seeking) intent.seekTarget else r.position,
      duration = if (r.metadataKnown) r.duration else Double.NaN,
      buffered = r.buffered,
      seekable = r.seekable,
      error = r.error,
      paused = intent.paused,
      ended = ended,
      seeking = seeking,
      currentSrc = intent.src,
      readyState = readyState,
      playbackRate = intent.playbackRate,
      contentData = r.contentData,
    )

  return MediaSnapshot(
    state = state,
    sourceGen = intent.sourceGen,
    seekGen = intent.seekGen,
    starved = requested && readyState < ReadyState.HAVE_FUTURE_DATA,
    playing = requested && readyState >= ReadyState.HAVE_FUTURE_DATA && !seeking,
  )
}

/**
 * The events a media element fires going from [prev] to [next], in its order.
 * This is the only place events come from.
 */
internal fun diff(prev: MediaSnapshot, next: MediaSnapshot): List<PlayerEvent> {
  val events = mutableListOf<PlayerEvent>()
  val n = next.state
  val newSource = next.sourceGen != prev.sourceGen

  // A new source compares against a fresh element, so its load reads as the
  // full sequence even when several steps land in one write.
  val base =
    if (newSource) {
      derive(Intent(src = n.currentSrc, sourceGen = next.sourceGen, paused = prev.state.paused, playbackRate = prev.state.playbackRate), Reported())
        .copy(seekGen = next.seekGen)
    } else {
      prev
    }
  val p = base.state

  // The load algorithm: the old source empties (resetting the position fires
  // `timeupdate`), then the new one starts loading.
  if (newSource && prev.state.currentSrc.isNotEmpty()) {
    events += PlayerEvent(PlayerEventType.EMPTIED)
    if (prev.state.currentTime != 0.0) events += PlayerEvent(PlayerEventType.TIMEUPDATE, currentTime = 0.0)
    if (prev.state.contentData != PlayerContentData()) events += PlayerEvent(PlayerEventType.CONTENTDATACHANGE)
  }
  if (newSource && n.currentSrc.isNotEmpty()) events += PlayerEvent(PlayerEventType.LOADSTART)

  if (p.error == null && n.error != null) events += PlayerEvent(PlayerEventType.ERROR, error = n.error)
  if (p.paused && !n.paused) events += PlayerEvent(PlayerEventType.PLAY)
  // A seek issued while another is in flight fires `seeking` again, as on the web.
  if (n.seeking && next.seekGen != base.seekGen) events += PlayerEvent(PlayerEventType.SEEKING)
  if (p.currentTime != n.currentTime) events += PlayerEvent(PlayerEventType.TIMEUPDATE, currentTime = n.currentTime)
  if (p.seeking && !n.seeking) events += PlayerEvent(PlayerEventType.SEEKED)
  if (!p.paused && n.paused) events += PlayerEvent(PlayerEventType.PAUSE)
  if (!sameNumber(p.duration, n.duration)) events += PlayerEvent(PlayerEventType.DURATIONCHANGE, duration = n.duration)

  // The spec's ready-state transition table.
  if (p.readyState < ReadyState.HAVE_METADATA && n.readyState >= ReadyState.HAVE_METADATA) {
    events += PlayerEvent(PlayerEventType.LOADEDMETADATA)
  }
  if (p.readyState < ReadyState.HAVE_FUTURE_DATA && n.readyState >= ReadyState.HAVE_FUTURE_DATA) {
    events += PlayerEvent(PlayerEventType.CANPLAY)
  }
  if (p.readyState < ReadyState.HAVE_ENOUGH_DATA && n.readyState == ReadyState.HAVE_ENOUGH_DATA) {
    events += PlayerEvent(PlayerEventType.CANPLAYTHROUGH)
  }

  if (!base.playing && next.playing) events += PlayerEvent(PlayerEventType.PLAYING)
  if (!base.starved && next.starved) events += PlayerEvent(PlayerEventType.WAITING)
  // Ends, not ranges: a range that starts at the playhead moves with playback
  // without anything new having loaded.
  if (p.buffered.map { it.end } != n.buffered.map { it.end }) {
    events += PlayerEvent(PlayerEventType.PROGRESS, buffered = n.buffered)
  }
  if (p.playbackRate != n.playbackRate) events += PlayerEvent(PlayerEventType.RATECHANGE)
  if (!p.ended && n.ended) events += PlayerEvent(PlayerEventType.ENDED)
  if (p.contentData != n.contentData) events += PlayerEvent(PlayerEventType.CONTENTDATACHANGE)

  return events
}

// Commands: what each one means as intent, given the state it was issued in.
// The engine turns intent into player calls separately (reconcile), so these
// are synchronous and the getters reflect them immediately.

internal fun Intent.setSource(src: String) = copy(src = src, sourceGen = sourceGen + 1)

internal fun Intent.load() = if (src.isEmpty()) this else copy(sourceGen = sourceGen + 1)

// Playing after the end restarts from the beginning, which is a seek.
internal fun Intent.play(state: PlayerState) =
  if (state.ended) copy(paused = false).seek(state, state.seekable.firstOrNull()?.start ?: 0.0) else copy(paused = false)

internal fun Intent.pause() = copy(paused = true)

internal fun Intent.seek(state: PlayerState, seconds: Double) =
  if (src.isEmpty()) {
    this
  } else {
    copy(seekGen = seekGen + 1, seekSourceGen = sourceGen, seekTarget = clampToSeekable(seconds, state.seekable))
  }

internal fun Intent.setPlaybackRate(rate: Double) = if (rate <= 0) this else copy(playbackRate = rate)

internal fun Intent.setLoop(loop: Boolean) = copy(loop = loop)

/** Where a seek to [seconds] lands: the nearest seekable position, or as asked when nothing is seekable yet. */
internal fun clampToSeekable(seconds: Double, seekable: List<PlayerTimeRange>): Double {
  if (seekable.isEmpty()) return seconds.coerceAtLeast(0.0)

  return seekable
    .map { seconds.coerceIn(it.start, it.end) }
    .minBy { kotlin.math.abs(it - seconds) }
}

private fun sameNumber(a: Double, b: Double) = a == b || (a.isNaN() && b.isNaN())

/**
 * One write's worth of change, for a mirror across the thread hop: the fields
 * that changed, then the events announcing them.
 *
 * [version] orders writes. A command's own change reaches JS synchronously, as
 * its return value, while changes from earlier engine writes may still be
 * queued behind it. So a mirror applies a field only when it holds an older
 * version of that field; a late change still fires its events, but never rolls
 * state back. (On the web, too, state can be newer than the event announcing it.)
 *
 * Only changed fields travel, so `contentData` (an inlined poster, possibly)
 * crosses once per change rather than once per read.
 */
internal data class MediaChange(val version: Long, val patch: Map<String, Any?>, val events: List<PlayerEvent>) {
  val isEmpty: Boolean
    get() = patch.isEmpty() && events.isEmpty()
}

/** The fields of [next] that differ from [prev], by `HTMLMediaElement` property name. */
internal fun patch(prev: PlayerState, next: PlayerState): Map<String, Any?> =
  buildMap {
    if (!sameNumber(prev.currentTime, next.currentTime)) put("currentTime", next.currentTime)
    if (!sameNumber(prev.duration, next.duration)) put("duration", next.duration)
    if (prev.buffered != next.buffered) put("buffered", next.buffered)
    if (prev.seekable != next.seekable) put("seekable", next.seekable)
    if (prev.error != next.error) put("error", next.error)
    if (prev.paused != next.paused) put("paused", next.paused)
    if (prev.ended != next.ended) put("ended", next.ended)
    if (prev.seeking != next.seeking) put("seeking", next.seeking)
    if (prev.currentSrc != next.currentSrc) put("currentSrc", next.currentSrc)
    if (prev.readyState != next.readyState) put("readyState", next.readyState)
    if (prev.playbackRate != next.playbackRate) put("playbackRate", next.playbackRate)
    if (prev.contentData != next.contentData) put("contentData", next.contentData)
  }

/** Every field of [state], as a patch: what a mirror starting late needs. */
internal fun fullPatch(state: PlayerState): Map<String, Any?> =
  mapOf(
    "currentTime" to state.currentTime,
    "duration" to state.duration,
    "buffered" to state.buffered,
    "seekable" to state.seekable,
    "error" to state.error,
    "paused" to state.paused,
    "ended" to state.ended,
    "seeking" to state.seeking,
    "currentSrc" to state.currentSrc,
    "readyState" to state.readyState,
    "playbackRate" to state.playbackRate,
    "contentData" to state.contentData,
  )

/** Mutable view of both inputs for one atomic write. */
internal class MediaTransaction(var intent: Intent, var reported: Reported, val state: PlayerState)

/**
 * Holds [Intent] and [Reported] under one lock. Every write derives the next
 * state, diffs it against the last, and versions the result in the same
 * critical section, so getters, patches and events agree, and changes reach
 * [emit] in write order whichever thread wrote.
 *
 * [emit] runs inside the lock; it should queue, not dispatch.
 */
internal class MediaStore(private val emit: (MediaChange) -> Unit) {
  private val lock = Any()
  private var intent = Intent()
  private var reported = Reported()
  private var snapshot = derive(intent, reported)
  private var version = 0L

  /** Any thread. What the getters report. */
  fun read(): PlayerState = synchronized(lock) { snapshot.state }

  fun readIntent(): Intent = synchronized(lock) { intent }

  /** Any thread. All of the state, at the version it was last written at. */
  fun readUpdate(): MediaChange = synchronized(lock) { MediaChange(version, fullPatch(snapshot.state), emptyList()) }

  /** Any thread. Writes either input or both as one step, so their events come out in one diff. */
  fun transact(block: MediaTransaction.() -> Unit): MediaChange =
    synchronized(lock) {
      val tx = MediaTransaction(intent, reported, snapshot.state).apply(block)
      val next = derive(tx.intent, tx.reported)
      val change = MediaChange(version + 1, patch(snapshot.state, next.state), diff(snapshot, next))

      intent = tx.intent
      reported = tx.reported
      snapshot = next

      if (change.isEmpty) return@synchronized change

      version = change.version
      emit(change)

      change
    }

  fun updateIntent(transform: (Intent, PlayerState) -> Intent) = transact { intent = transform(intent, state) }

  fun updateReported(transform: (Reported) -> Reported) = transact { reported = transform(reported) }

  /** Back to a fresh element, without events: nothing is listening any more. */
  fun reset() =
    synchronized(lock) {
      intent = Intent()
      reported = Reported()
      snapshot = derive(intent, reported)
    }
}

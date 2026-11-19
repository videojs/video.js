package com.reactnative

import android.content.Context
import android.os.Handler
import android.util.Base64
import android.os.Looper
import android.view.SurfaceView
import androidx.annotation.MainThread
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer

/** Mirrors `PlayerEvent['type']` in `src/media/NativeEngineStore.ts`. */
internal enum class PlayerEventType(val jsName: String) {
  LOADSTART("loadstart"),
  EMPTIED("emptied"),
  LOADEDMETADATA("loadedmetadata"),
  DURATIONCHANGE("durationchange"),
  PROGRESS("progress"),
  CANPLAY("canplay"),
  CANPLAYTHROUGH("canplaythrough"),
  ERROR("error"),
  PLAY("play"),
  PAUSE("pause"),
  PLAYING("playing"),
  WAITING("waiting"),
  ENDED("ended"),
  TIMEUPDATE("timeupdate"),
  RATECHANGE("ratechange"),
  SEEKING("seeking"),
  SEEKED("seeked"),
  CONTENTDATACHANGE("contentdatachange"),
}

/** Seconds. */
internal data class PlayerTimeRange(val start: Double, val end: Double)

/** `code` is a `MediaError` code. */
internal data class PlayerError(val code: Int, val message: String)

/** Mirrors `PlayerContentData`; a key is null unless the content supplies it. */
internal data class PlayerContentData(val title: String? = null, val poster: String? = null)

/**
 * Mirrors `PlayerEvent` in `src/media/NativeEngineStore.ts`, minus the handle
 * the registry adds. Flat like the codegen payload, so each value is set only
 * on the event type that reports it.
 */
internal data class PlayerEvent(
  val type: PlayerEventType,
  val currentTime: Double? = null,
  val duration: Double? = null,
  val buffered: List<PlayerTimeRange>? = null,
  val error: PlayerError? = null,
)

// `MediaError` codes.
private const val MEDIA_ERR_NETWORK = 2
private const val MEDIA_ERR_DECODE = 3
private const val MEDIA_ERR_SRC_NOT_SUPPORTED = 4
private const val MEDIA_ERR_ENCRYPTED = 5
private const val MEDIA_ERR_CUSTOM = 100

// `HTMLMediaElement.readyState` values.
private const val HAVE_NOTHING = 0
private const val HAVE_METADATA = 1
private const val HAVE_CURRENT_DATA = 2
private const val HAVE_ENOUGH_DATA = 4

// HTMLMediaElement fires `timeupdate` every 15–250ms and `progress` roughly
// every 350ms; one tick at the upper `timeupdate` bound serves both.
private const val TICK_INTERVAL_MS = 250L

/**
 * One `ExoPlayer` behind one handle. Built on the calling (JS) thread so a
 * command issued right after `createPlayer` has an engine to reach, but the
 * player itself is confined to the main thread: commands are callable from any
 * thread and post their player work to the main looper, and the Fabric surface
 * is already on the UI thread.
 *
 * ExoPlayer reports state, not media events, so the engine keeps the
 * HTMLMediaElement-shaped state each event marks a transition of and emits only
 * on change.
 *
 * The element-shaped state lives in [PlayerState], which can be updated from either ExoPlayer
 * events or commands from JS:
 * - Commands write what they mean, on the calling thread, before posting the
 *   player work to the main thread, so a getter called right after one
 *   reflects it as a media element's would.
 * - The engine writes what the player reports, on the main thread, before
 *   emitting the event that announces it, so a getter called from JS will see the reported state
 *   (or newer, if more commands have been issued)
 *
 * Externally, the state in [PlayerState] "wins," as the engine is controlled from the JS side.
 * ExoPlayer state updates defer to the [PlayerState] where necessary. eg, `currentTime` is read
 * from [PlayerState] while a seek is in progress to keep the valie stable, and source-related
 * values in PlayerState are only updated as long as the player's source matches `currentSrc`
 */
@OptIn(UnstableApi::class)
internal class PlayerEngine(
  context: Context,
  source: String?,
  private val onEvent: (PlayerEvent) -> Unit,
) {
  // Built on the calling thread, so without an explicit looper ExoPlayer would
  // bind to the JS thread's and reject every call from the main thread.
  private val exo = ExoPlayer.Builder(context).setLooper(Looper.getMainLooper()).build()
  private val mainHandler = Handler(Looper.getMainLooper())

  private val stateLock = Any()
  private var state = PlayerState(currentSrc = source ?: "")

  // The engine renders into the most recently attached surface only. Lower
  // entries stay registered so a pop can fall back without the surface below
  // having to re-register.
  private val surfaces = ArrayDeque<SurfaceView>()

  // The last `paused` reported through `play`/`pause` events.
  private var paused = true
  private var waiting = false
  private var playbackSpeed = PlaybackParameters.DEFAULT.speed

  // Per source; reset when the source is swapped.
  private var source: String? = null
  private var metadataLoaded = false
  private var bufferedPositionMs = 0L
  private var hasContentData = false

  // The target of the seek in flight, settled by the first READY after it;
  // ExoPlayer masks every seek to BUFFERING, so one always follows.
  private var seekTarget: Double? = null

  private var ticking = false
  private var released = false

  private val tick =
    Runnable {
      if (exo.isPlaying) emitTimeUpdate()
      syncBufferedPosition()

      ticking = false
      syncTicker()
    }

  init {
    exo.addListener(
      object : Player.Listener {
        override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
          syncPaused()
          syncWaiting()
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
          updateForSource { it.copy(readyState = readyState) }
          syncPaused()
          syncWaiting()

          when (playbackState) {
            Player.STATE_READY -> {
              settleSeek()

              if (!metadataLoaded) {
                metadataLoaded = true
                syncDuration()
                updateForSource { it.copy(seekable = seekable, readyState = readyState) }
                emit(PlayerEventType.LOADEDMETADATA)
              }

              // READY is ExoPlayer's only "has data" state, so it stands in for
              // both readiness levels a media element distinguishes.
              emit(PlayerEventType.CANPLAY)
              emit(PlayerEventType.CANPLAYTHROUGH)
            }

            // A media element stays paused once it ends, so seeking back
            // doesn't resume; ExoPlayer would, with `playWhenReady` still set.
            Player.STATE_ENDED -> {
              settleSeek()
              exo.pause()
              updateForSource { it.copy(ended = true) }
              emit(PlayerEventType.ENDED)
            }
          }
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
          if (isPlaying) emit(PlayerEventType.PLAYING)
          syncTicker()
        }

        override fun onIsLoadingChanged(isLoading: Boolean) {
          syncTicker()
        }

        // Also where a live window slides, which moves `seekable` with no
        // media event to carry it.
        override fun onTimelineChanged(timeline: Timeline, reason: Int) {
          syncDuration()
          updateForSource { it.copy(seekable = seekable) }
        }

        override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) {
          if (playbackParameters.speed == playbackSpeed) return

          playbackSpeed = playbackParameters.speed
          updatePlayerState { it.copy(playbackRate = playbackSpeed.toDouble()) }
          emit(PlayerEventType.RATECHANGE)
        }

        override fun onPlayerError(error: PlaybackException) {
          val playerError = toPlayerError(error)

          updateForSource { it.copy(error = playerError) }
          emit(PlayerEvent(PlayerEventType.ERROR, error = playerError))
        }

        override fun onMediaMetadataChanged(mediaMetadata: MediaMetadata) {
          syncContentData()
        }
      }
    )

    // A null source leaves the player idle until `setSource` supplies one. The
    // snapshot already holds it as `currentSrc`.
    if (source != null) onMain { setSourceInternal(source) }
  }

  // Commands, from any thread: each writes the state it will produce, then
  // posts the player work.

  // A new source starts from a media element's initial state; only `paused`
  // and `playbackRate` belong to the element rather than the source.
  fun setSource(source: String) {
    updatePlayerState { PlayerState(currentSrc = source, paused = it.paused, playbackRate = it.playbackRate) }
    onMain { setSourceInternal(source) }
  }

  fun load() {
    updatePlayerState { if (it.currentSrc.isEmpty()) it else PlayerState(currentSrc = it.currentSrc, paused = it.paused, playbackRate = it.playbackRate) }
    onMain { source?.let(::setSourceInternal) }
  }

  // Playing after the end restarts from the beginning, which is a seek.
  fun play() {
    updatePlayerState { if (it.ended) it.copy(paused = false, ended = false, currentTime = 0.0, seeking = true) else it.copy(paused = false) }
    onMain {
      if (exo.playbackState == Player.STATE_ENDED) seekTo(0.0)
      exo.play()
    }
  }

  fun pause() {
    updatePlayerState { it.copy(paused = true) }
    onMain { exo.pause() }
  }

  fun setPlaybackRate(rate: Double) {
    if (rate <= 0) return

    updatePlayerState { it.copy(playbackRate = rate) }
    onMain { exo.setPlaybackSpeed(rate.toFloat()) }
  }

  // `loop` isn't in the snapshot, so there is no state to write. ExoPlayer
  // repeats the item in place instead of ending, so there is no `ended`, as
  // with a looping media element.
  fun setLoop(loop: Boolean) {
    onMain { exo.repeatMode = if (loop) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF }
  }

  fun setCurrentTime(seconds: Double) {
    val target = seconds.coerceAtLeast(0.0)

    updatePlayerState { if (it.currentSrc.isEmpty()) it else it.copy(currentTime = target, seeking = true, ended = false) }
    onMain { if (exo.mediaItemCount > 0) seekTo(target) }
  }

  /**
   * Swaps the source on the running player. `playWhenReady` survives the swap,
   * so a player that was playing continues into the new source.
   */
  @MainThread
  private fun setSourceInternal(source: String) {
    if (exo.mediaItemCount > 0) emit(PlayerEventType.EMPTIED)
    if (hasContentData) emit(PlayerEventType.CONTENTDATACHANGE)

    this.source = source
    metadataLoaded = false
    bufferedPositionMs = 0L
    hasContentData = false
    seekTarget = null

    emit(PlayerEventType.LOADSTART)
    exo.setMediaItem(MediaItem.fromUri(source))
    exo.prepare()
  }

  /** Any thread. */
  fun readState(): PlayerState = synchronized(stateLock) { state }

  fun attachSurface(surface: SurfaceView) {
    surfaces.remove(surface)
    surfaces.addLast(surface)
    exo.setVideoSurfaceView(surface)
  }

  fun detachSurface(surface: SurfaceView) {
    val wasRendering = surfaces.lastOrNull() === surface
    surfaces.remove(surface)

    if (!wasRendering) return

    val next = surfaces.lastOrNull()

    if (next == null) exo.clearVideoSurface() else exo.setVideoSurfaceView(next)
  }

  fun release() {
    released = true

    updatePlayerState { PlayerState() }
    mainHandler.removeCallbacks(tick)
    surfaces.clear()
    exo.release()
  }

  private val currentTime: Double
    get() = exo.currentPosition / 1000.0

  // A media element reports live as infinite; ExoPlayer reports the growing
  // window.
  private val duration: Double
    get() =
      when {
        exo.isCurrentMediaItemLive -> Double.POSITIVE_INFINITY
        exo.duration == C.TIME_UNSET -> Double.NaN
        else -> exo.duration / 1000.0
      }

  // ExoPlayer discards played-back media and tracks only how far ahead it has
  // buffered, so the playhead is the earliest position known to be buffered.
  private val buffered: List<PlayerTimeRange>
    get() {
      val start = exo.currentPosition
      val end = exo.bufferedPosition

      return if (end > start) listOf(PlayerTimeRange(start / 1000.0, end / 1000.0)) else emptyList()
    }

  // Positions are relative to the live window, so live seeks within
  // `[0, window]` too.
  private val seekable: List<PlayerTimeRange>
    get() =
      if (!exo.isCurrentMediaItemSeekable || exo.duration == C.TIME_UNSET) {
        emptyList()
      } else {
        listOf(PlayerTimeRange(0.0, exo.duration / 1000.0))
      }

  // READY is the only state that implies data ahead of the playhead, and
  // `canplaythrough` already treats it as enough.
  private val readyState: Int
    get() =
      when (exo.playbackState) {
        Player.STATE_READY,
        Player.STATE_ENDED -> HAVE_ENOUGH_DATA
        Player.STATE_BUFFERING ->
          when {
            !metadataLoaded -> HAVE_NOTHING
            exo.bufferedPosition > exo.currentPosition -> HAVE_CURRENT_DATA
            else -> HAVE_METADATA
          }
        else -> if (metadataLoaded) HAVE_METADATA else HAVE_NOTHING
      }

  private fun seekTo(seconds: Double) {
    seekTarget = seconds

    emit(PlayerEventType.SEEKING)
    exo.seekTo((seconds * 1000).toLong())
    emitTimeUpdate()
  }

  // A newer seek, or a new source, has replaced `currentTime` since this seek
  // was requested; that one settles `seeking` instead, so this stays quiet as a
  // superseded seek does on the web.
  private fun settleSeek() {
    val target = seekTarget ?: return
    var settled = false

    seekTarget = null
    updateForSource {
      if (!it.seeking || it.currentTime != target) return@updateForSource it

      settled = true
      it.copy(seeking = false, currentTime = currentTime)
    }

    if (settled) emit(PlayerEventType.SEEKED)
  }

  // `paused` follows the web definition: ExoPlayer keeps `playWhenReady` set
  // after the end, but a media element reports paused there.
  private fun syncPaused() {
    val next = !exo.playWhenReady || exo.playbackState == Player.STATE_ENDED

    if (next == paused) return

    paused = next

    // A media element reports the position it stopped at before `pause`.
    if (paused) emitTimeUpdate()
    updatePlayerState { it.copy(paused = paused) }
    emit(if (paused) PlayerEventType.PAUSE else PlayerEventType.PLAY)
  }

  // Waiting means playback was requested but is starved, so it trails `paused`.
  private fun syncWaiting() {
    val next = !paused && exo.playbackState == Player.STATE_BUFFERING

    if (next == waiting) return

    waiting = next

    if (waiting) emit(PlayerEventType.WAITING)
  }

  private fun syncDuration() {
    val next = duration
    var changed = false

    if (next.isNaN()) return

    updateForSource {
      if (it.duration == next) return@updateForSource it

      changed = true
      it.copy(duration = next, seekable = seekable)
    }

    if (changed) emit(PlayerEvent(PlayerEventType.DURATIONCHANGE, duration = next))
  }

  private fun syncBufferedPosition() {
    val next = exo.bufferedPosition

    if (next == bufferedPositionMs) return

    val ranges = buffered

    bufferedPositionMs = next
    updateForSource { it.copy(buffered = ranges, readyState = readyState) }
    emit(PlayerEvent(PlayerEventType.PROGRESS, buffered = ranges))
  }

  // We never set `MediaItem` metadata, so everything here came from the
  // content.
  private fun syncContentData() {
    val metadata = exo.mediaMetadata
    val next =
      PlayerContentData(
        title = metadata.title?.toString(),
        poster = metadata.artworkUri?.toString() ?: metadata.artworkData?.let(::toImageDataUri),
      )
    var changed = false

    updateForSource {
      if (it.contentData == next) return@updateForSource it

      changed = true
      it.copy(contentData = next)
    }

    if (!changed) return

    hasContentData = next != PlayerContentData()
    emit(PlayerEventType.CONTENTDATACHANGE)
  }

  // A pending seek owns `currentTime`, so the payload reports what the
  // snapshot holds rather than the player's position.
  private fun emitTimeUpdate() {
    val reported = updateForSource { if (it.seeking) it else it.copy(currentTime = currentTime) }

    emit(PlayerEvent(PlayerEventType.TIMEUPDATE, currentTime = reported.currentTime))
  }

  // ExoPlayer has no position or buffer callbacks, so both are polled while
  // either can be moving.
  private fun syncTicker() {
    val shouldTick = !released && (exo.isPlaying || exo.isLoading)

    if (shouldTick == ticking) return

    ticking = shouldTick

    if (ticking) mainHandler.postDelayed(tick, TICK_INTERVAL_MS) else mainHandler.removeCallbacks(tick)
  }

  // Always posts, never runs inline on the main thread, so player work keeps
  // the order its commands were issued in. Work posted before `release` runs
  // ahead of it; anything later finds the player gone and is dropped.
  private fun onMain(block: () -> Unit) {
    mainHandler.post { if (!released) block() }
  }

  private fun emit(type: PlayerEventType) {
    emit(PlayerEvent(type))
  }

  private fun emit(event: PlayerEvent) {
    if (!released) onEvent(event)
  }

  /** Any thread. Returns the snapshot it left in place. */
  private fun updatePlayerState(transform: (PlayerState) -> PlayerState): PlayerState =
    synchronized(stateLock) {
      state = transform(state)
      state
    }

  // Per-source values belong to the source the player is on. Once a command
  // has moved `currentSrc` on, they would only leak the old source into the
  // new one's state.
  private fun updateForSource(transform: (PlayerState) -> PlayerState): PlayerState =
    updatePlayerState { if (it.currentSrc == (source ?: "")) transform(it) else it }
}

// Error codes are grouped by thousand. The miscellaneous group (timeouts,
// falling behind the live window, …) has no media element equivalent.
private fun toPlayerError(error: PlaybackException): PlayerError {
  val code =
    when (error.errorCode) {
      in 2000..2999 -> MEDIA_ERR_NETWORK
      in 3000..3999 -> MEDIA_ERR_SRC_NOT_SUPPORTED
      in 4000..5999 -> MEDIA_ERR_DECODE
      in 6000..6999 -> MEDIA_ERR_ENCRYPTED
      else -> MEDIA_ERR_CUSTOM
    }

  return PlayerError(code, listOfNotNull(error.errorCodeName, error.message).joinToString(": "))
}

// Embedded artwork has no URL, so it is inlined. Only formats an image view can
// be relied on to decode are reported.
private fun toImageDataUri(bytes: ByteArray): String? {
  val mimeType =
    when {
      bytes.startsWith(0xFF, 0xD8, 0xFF) -> "image/jpeg"
      bytes.startsWith(0x89, 0x50, 0x4E, 0x47) -> "image/png"
      else -> return null
    }

  return "data:$mimeType;base64,${Base64.encodeToString(bytes, Base64.NO_WRAP)}"
}

private fun ByteArray.startsWith(vararg prefix: Int): Boolean =
  size >= prefix.size && prefix.indices.all { this[it] == prefix[it].toByte() }

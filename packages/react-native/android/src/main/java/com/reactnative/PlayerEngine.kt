package com.reactnative

import android.content.Context
import android.os.Handler
import android.util.Base64
import android.os.Looper
import android.view.SurfaceView
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Timeline
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
 * One `ExoPlayer` behind one handle. Confined to the main thread — every entry
 * point is reached either from [PlayerRegistry]'s main-looper dispatch or from
 * the Fabric surface, which is already on the UI thread.
 *
 * ExoPlayer reports state, not media events, so the engine keeps the
 * HTMLMediaElement-shaped state each event marks a transition of and emits only
 * on change.
 *
 * The one exception to main-thread confinement is the [PlayerState] snapshot,
 * which the JS thread reads through [readState]. The engine republishes it
 * before every event, so a getter called while handling one sees state at least
 * that new. One lock covers the whole snapshot.
 */
internal class PlayerEngine(
  context: Context,
  source: String?,
  private val onEvent: (PlayerEvent) -> Unit,
) {
  private val exo = ExoPlayer.Builder(context).build()

  private val stateLock = Any()
  private var state = PlayerState()
  private val mainHandler = Handler(Looper.getMainLooper())

  // The engine renders into the most recently attached surface only. Lower
  // entries stay registered so a pop can fall back without the surface below
  // having to re-register.
  private val surfaces = ArrayDeque<SurfaceView>()

  // `paused` follows the web definition: ExoPlayer keeps `playWhenReady` set
  // after the end, but a media element reports paused there.
  private var paused = true
  private var waiting = false
  private var playbackSpeed = PlaybackParameters.DEFAULT.speed

  // Per source; reset when the source is swapped.
  private var source: String? = null
  private var metadataLoaded = false
  private var reportedDuration = Double.NaN
  private var bufferedPositionMs = 0L
  private var lastError: PlayerError? = null
  private var reportedContentData = PlayerContentData()

  // Cleared by the first READY after the seek; ExoPlayer masks every seek to
  // BUFFERING, so one always follows.
  private var seeking = false

  private var ticking = false
  private var released = false

  private val tick =
    object : Runnable {
      override fun run() {
        if (exo.isPlaying) emitTimeUpdate()
        syncBufferedPosition()

        ticking = false
        syncTicker()
      }
    }

  init {
    exo.addListener(
      object : Player.Listener {
        override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
          syncPaused()
          syncWaiting()
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
          syncPaused()
          syncWaiting()

          when (playbackState) {
            Player.STATE_READY -> {
              if (seeking) {
                seeking = false
                emit(PlayerEventType.SEEKED)
              }

              if (!metadataLoaded) {
                metadataLoaded = true
                syncDuration()
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
              exo.pause()
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
          publishState()
        }

        override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) {
          if (playbackParameters.speed == playbackSpeed) return

          playbackSpeed = playbackParameters.speed
          emit(PlayerEventType.RATECHANGE)
        }

        override fun onPlayerError(error: PlaybackException) {
          val playerError = toPlayerError(error)

          lastError = playerError
          emit(PlayerEvent(PlayerEventType.ERROR, error = playerError))
        }

        override fun onMediaMetadataChanged(mediaMetadata: MediaMetadata) {
          syncContentData()
        }
      }
    )

    // A null source leaves the player idle until `setSource` supplies one.
    if (source != null) setSource(source)
  }

  /**
   * Swaps the source on the running player. `playWhenReady` survives the swap,
   * so a player that was playing continues into the new source.
   */
  fun setSource(source: String) {
    if (exo.mediaItemCount > 0) emit(PlayerEventType.EMPTIED)

    this.source = source
    metadataLoaded = false
    reportedDuration = Double.NaN
    bufferedPositionMs = 0L
    lastError = null
    seeking = false
    clearContentData()

    emit(PlayerEventType.LOADSTART)
    exo.setMediaItem(MediaItem.fromUri(source))
    exo.prepare()
  }

  fun load() {
    source?.let(::setSource)
  }

  // A media element restarts from the beginning when played after the end.
  fun play() {
    if (exo.playbackState == Player.STATE_ENDED) setCurrentTime(0.0)
    exo.play()
  }

  fun pause() {
    exo.pause()
  }

  fun setCurrentTime(seconds: Double) {
    if (exo.mediaItemCount == 0) return

    seeking = true

    emit(PlayerEventType.SEEKING)
    exo.seekTo((seconds.coerceAtLeast(0.0) * 1000).toLong())
    emitTimeUpdate()
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

  /** Any thread. */
  fun readState(): PlayerState = synchronized(stateLock) { state }

  fun release() {
    released = true

    resetState()
    mainHandler.removeCallbacks(tick)
    surfaces.clear()
    exo.release()
  }

  private fun syncPaused() {
    val next = !exo.playWhenReady || exo.playbackState == Player.STATE_ENDED

    if (next == paused) return

    paused = next

    // A media element reports the position it stopped at before `pause`.
    if (paused) emitTimeUpdate()
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

    if (next.isNaN() || next == reportedDuration) return

    reportedDuration = next
    emit(PlayerEvent(PlayerEventType.DURATIONCHANGE, duration = next))
  }

  private fun syncBufferedPosition() {
    val next = exo.bufferedPosition

    if (next == bufferedPositionMs) return

    bufferedPositionMs = next
    emit(PlayerEvent(PlayerEventType.PROGRESS, buffered = buffered))
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

    if (next == reportedContentData) return

    reportedContentData = next
    emit(PlayerEventType.CONTENTDATACHANGE)
  }

  private fun clearContentData() {
    if (reportedContentData == PlayerContentData()) return

    reportedContentData = PlayerContentData()
    emit(PlayerEventType.CONTENTDATACHANGE)
  }

  private fun emitTimeUpdate() {
    emit(PlayerEvent(PlayerEventType.TIMEUPDATE, currentTime = currentTime))
  }

  // ExoPlayer has no position or buffer callbacks, so both are polled while
  // either can be moving.
  private fun syncTicker() {
    val shouldTick = !released && (exo.isPlaying || exo.isLoading)

    if (shouldTick == ticking) return

    ticking = shouldTick

    if (ticking) mainHandler.postDelayed(tick, TICK_INTERVAL_MS) else mainHandler.removeCallbacks(tick)
  }

  private fun emit(type: PlayerEventType) {
    emit(PlayerEvent(type))
  }

  private fun emit(event: PlayerEvent) {
    if (released) return

    publishState()
    onEvent(event)
  }

  private fun resetState() {
    synchronized(stateLock) { state = PlayerState() }
  }

  private fun publishState() {
    if (released) return

    val next =
      PlayerState(
        currentTime = currentTime,
        duration = duration,
        buffered = buffered,
        seekable = seekable,
        error = lastError,
        paused = paused,
        ended = exo.playbackState == Player.STATE_ENDED,
        seeking = seeking,
        currentSrc = source ?: "",
        readyState = readyState,
        playbackRate = exo.playbackParameters.speed.toDouble(),
        contentData = reportedContentData,
      )

    synchronized(stateLock) { state = next }
  }
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

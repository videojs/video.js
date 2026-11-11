package com.reactnative

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.SurfaceView
import androidx.media3.common.C
import androidx.media3.common.MediaItem
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

  // Not emitted yet: nothing can seek until the engine grows a seek command,
  // which is where these belong.
  SEEKING("seeking"),
  SEEKED("seeked"),
}

/** Seconds. */
internal data class PlayerTimeRange(val start: Double, val end: Double)

/** `code` is a `MediaError` code. */
internal data class PlayerError(val code: Int, val message: String)

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
 */
internal class PlayerEngine(
  context: Context,
  source: String?,
  private val onEvent: (PlayerEvent) -> Unit,
) {
  private val exo = ExoPlayer.Builder(context).build()
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
  private var metadataLoaded = false
  private var duration: Double? = null
  private var bufferedPositionMs = 0L

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

            Player.STATE_ENDED -> emit(PlayerEventType.ENDED)
          }
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
          if (isPlaying) emit(PlayerEventType.PLAYING)
          syncTicker()
        }

        override fun onIsLoadingChanged(isLoading: Boolean) {
          syncTicker()
        }

        override fun onTimelineChanged(timeline: Timeline, reason: Int) {
          syncDuration()
        }

        override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) {
          if (playbackParameters.speed == playbackSpeed) return

          playbackSpeed = playbackParameters.speed
          emit(PlayerEventType.RATECHANGE)
        }

        override fun onPlayerError(error: PlaybackException) {
          emit(PlayerEvent(PlayerEventType.ERROR, error = toPlayerError(error)))
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

    metadataLoaded = false
    duration = null
    bufferedPositionMs = 0L

    emit(PlayerEventType.LOADSTART)
    exo.setMediaItem(MediaItem.fromUri(source))
    exo.prepare()
  }

  fun play() {
    exo.play()
  }

  fun pause() {
    exo.pause()
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

  fun release() {
    released = true

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

  // A media element reports live as an infinite duration; ExoPlayer reports
  // the current window, which keeps growing.
  private fun syncDuration() {
    val next =
      when {
        exo.isCurrentMediaItemLive -> Double.POSITIVE_INFINITY
        exo.duration == C.TIME_UNSET -> null
        else -> exo.duration / 1000.0
      }

    if (next == null || next == duration) return

    duration = next
    emit(PlayerEvent(PlayerEventType.DURATIONCHANGE, duration = next))
  }

  // ExoPlayer discards played-back media and tracks only how far ahead it has
  // buffered, so the playhead is the earliest position known to be buffered.
  private fun syncBufferedPosition() {
    val next = exo.bufferedPosition

    if (next == bufferedPositionMs) return

    bufferedPositionMs = next

    val start = exo.currentPosition
    val buffered = if (next > start) listOf(PlayerTimeRange(start / 1000.0, next / 1000.0)) else emptyList()

    emit(PlayerEvent(PlayerEventType.PROGRESS, buffered = buffered))
  }

  private fun emitTimeUpdate() {
    emit(PlayerEvent(PlayerEventType.TIMEUPDATE, currentTime = exo.currentPosition / 1000.0))
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
    if (!released) onEvent(event)
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

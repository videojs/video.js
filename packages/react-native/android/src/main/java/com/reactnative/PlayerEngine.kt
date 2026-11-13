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
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer

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
 * One `ExoPlayer` behind one handle, as a media element (POC: unidirectional).
 *
 * The engine doesn't keep media element state or decide which events to fire.
 * It does two things, both on the main thread:
 * - **Report**: read ExoPlayer's facts into [Reported], once per batch of
 *   player changes and on each tick.
 * - **Reconcile**: drive ExoPlayer toward [Intent].
 *
 * Commands write [Intent] on the calling (JS) thread and post a reconcile.
 * [MediaStore] derives the element state the getters read and the events to
 * fire from the two; see `MediaModel.kt`.
 */
@OptIn(UnstableApi::class)
internal class PlayerEngine(
  context: Context,
  source: String?,
  private val onChange: (MediaChange) -> Unit,
) {
  // Built on the calling thread, so without an explicit looper ExoPlayer would
  // bind to the JS thread's and reject every call from the main thread.
  private val exo = ExoPlayer.Builder(context).setLooper(Looper.getMainLooper()).build()
  private val mainHandler = Handler(Looper.getMainLooper())

  // Changes are queued onto the main looper in write order, whichever thread
  // wrote, and delivered after the write that produced them, as a media
  // element's queued tasks are.
  private val store = MediaStore { change -> mainHandler.post { if (!released) onChange(change) } }

  // The engine renders into the most recently attached surface only. Lower
  // entries stay registered so a pop can fall back without the surface below
  // having to re-register.
  private val surfaces = ArrayDeque<SurfaceView>()

  // What reconcile has applied to the player, so far.
  private var appliedSourceGen = 0
  private var appliedSeekGen = 0

  // Encoding embedded artwork is too costly to repeat on every report.
  private var contentMetadata: MediaMetadata? = null
  private var cachedContentData = PlayerContentData()

  private var ticking = false

  @Volatile private var released = false

  private val tick =
    Runnable {
      ticking = false
      report()
      syncTicker()
    }

  init {
    exo.addListener(
      object : Player.Listener {
        // ExoPlayer batches its changes; one read of every fact per batch
        // replaces a callback per fact.
        override fun onEvents(player: Player, events: Player.Events) {
          report()
          syncTicker()
        }

        // Reconcile's own writes are user requests. Anything else (audio focus,
        // headphones unplugged) is the platform pausing, which a media element
        // reports as paused.
        override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
          if (reason == Player.PLAY_WHEN_READY_CHANGE_REASON_USER_REQUEST) return

          store.updateIntent { intent, _ -> intent.copy(paused = !playWhenReady) }
        }
      }
    )

    if (source != null) setSource(source)
  }

  // The media element, from any thread. Getters pass through to the store;
  // each is its own read, so use [readState] to see several fields as of one
  // moment.

  val currentTime: Double get() = store.read().currentTime
  val duration: Double get() = store.read().duration
  val buffered: List<PlayerTimeRange> get() = store.read().buffered
  val seekable: List<PlayerTimeRange> get() = store.read().seekable
  val error: PlayerError? get() = store.read().error
  val paused: Boolean get() = store.read().paused
  val ended: Boolean get() = store.read().ended
  val seeking: Boolean get() = store.read().seeking
  val currentSrc: String get() = store.read().currentSrc
  val readyState: Int get() = store.read().readyState
  val playbackRate: Double get() = store.read().playbackRate
  val contentData: PlayerContentData get() = store.read().contentData

  fun readState(): PlayerState = store.read()

  /** All of the state as one update, for a mirror starting late. */
  fun readUpdate(): MediaChange = store.readUpdate()

  // Commands, from any thread. Each returns its own change, which the getters
  // already reflect: the bridge can hand it straight back to JS.

  fun setSource(source: String) = command { intent, _ -> intent.setSource(source) }

  fun load() = command { intent, _ -> intent.load() }

  fun play() = command { intent, state -> intent.play(state) }

  fun pause() = command { intent, _ -> intent.pause() }

  fun setCurrentTime(seconds: Double) = command { intent, state -> intent.seek(state, seconds) }

  fun setPlaybackRate(rate: Double) = command { intent, _ -> intent.setPlaybackRate(rate) }

  fun setLoop(loop: Boolean) = command { intent, _ -> intent.setLoop(loop) }

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

    store.reset()
    mainHandler.removeCallbacksAndMessages(null)
    surfaces.clear()
    exo.release()
  }

  // The getters reflect a command as soon as it returns; the player catches up
  // on the main thread.
  private fun command(transform: (Intent, PlayerState) -> Intent): MediaChange {
    val change = store.updateIntent(transform)

    onMain { reconcile() }

    return change
  }

  @MainThread
  private fun reconcile() {
    val intent = store.readIntent()

    if (intent.sourceGen != appliedSourceGen) {
      appliedSourceGen = intent.sourceGen

      if (intent.src.isEmpty()) {
        exo.clearMediaItems()
      } else {
        exo.setMediaItem(MediaItem.fromUri(intent.src))
        exo.prepare()
      }
    }

    // A seek against an older source is dropped. ExoPlayer takes a seek before
    // it's ready as the start position, so there's nothing to hold back.
    if (intent.seekGen > appliedSeekGen) {
      appliedSeekGen = intent.seekGen

      if (intent.seekSourceGen == appliedSourceGen) exo.seekTo((intent.seekTarget * 1000).toLong())
    }

    exo.playWhenReady = !intent.paused
    exo.repeatMode = if (intent.loop) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF

    if (exo.playbackParameters.speed != intent.playbackRate.toFloat()) exo.setPlaybackSpeed(intent.playbackRate.toFloat())

    report()
    syncTicker()
  }

  @MainThread
  private fun report() {
    if (released) return

    val phase =
      when (exo.playbackState) {
        Player.STATE_BUFFERING -> EnginePhase.BUFFERING
        Player.STATE_READY -> EnginePhase.READY
        Player.STATE_ENDED -> EnginePhase.ENDED
        else -> EnginePhase.IDLE
      }
    // ExoPlayer masks every seek to BUFFERING, so the first READY or ENDED
    // after one is where it finished.
    val settled = phase == EnginePhase.READY || phase == EnginePhase.ENDED
    var adoptedPause = false

    store.transact {
      reported =
        Reported(
          sourceGen = appliedSourceGen,
          seekGen = if (settled) appliedSeekGen else reported.seekGen,
          phase = phase,
          metadataKnown = metadataKnown,
          position = exo.currentPosition / 1000.0,
          buffered = exoBuffered,
          duration = exoDuration,
          seekable = exoSeekable,
          error = exo.playerError?.let(::toPlayerError),
          contentData = readContentData(),
        )

      // A media element pauses itself at the end; ExoPlayer keeps
      // `playWhenReady`. Same write, so `pause` fires before `ended`.
      if (!intent.paused && derive(intent, reported).state.ended) {
        intent = intent.pause()
        adoptedPause = true
      }
    }

    if (adoptedPause) onMain { reconcile() }
  }

  // ExoPlayer discards played-back media and tracks only how far ahead it has
  // buffered, so the playhead is the earliest position known to be buffered.
  private val exoBuffered: List<PlayerTimeRange>
    get() {
      val start = exo.currentPosition
      val end = exo.bufferedPosition

      return if (end > start) listOf(PlayerTimeRange(start / 1000.0, end / 1000.0)) else emptyList()
    }

  // ExoPlayer stands in a placeholder timeline until the real one is known.
  private val metadataKnown: Boolean
    get() {
      val timeline = exo.currentTimeline

      return !timeline.isEmpty && !timeline.getWindow(exo.currentMediaItemIndex, Timeline.Window()).isPlaceholder
    }

  // A media element reports live as infinite; ExoPlayer reports the growing
  // window.
  private val exoDuration: Double
    get() =
      when {
        exo.isCurrentMediaItemLive -> Double.POSITIVE_INFINITY
        exo.duration == C.TIME_UNSET -> Double.NaN
        else -> exo.duration / 1000.0
      }

  // Positions are relative to the live window, so live seeks within
  // `[0, window]` too.
  private val exoSeekable: List<PlayerTimeRange>
    get() =
      if (!exo.isCurrentMediaItemSeekable || exo.duration == C.TIME_UNSET) {
        emptyList()
      } else {
        listOf(PlayerTimeRange(0.0, exo.duration / 1000.0))
      }

  // We never set `MediaItem` metadata, so everything here came from the
  // content.
  private fun readContentData(): PlayerContentData {
    val metadata = exo.mediaMetadata

    if (metadata === contentMetadata) return cachedContentData

    contentMetadata = metadata
    cachedContentData =
      PlayerContentData(
        title = metadata.title?.toString(),
        poster = metadata.artworkUri?.toString() ?: metadata.artworkData?.let(::toImageDataUri),
      )

    return cachedContentData
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
  // the order its commands were issued in.
  private fun onMain(block: () -> Unit) {
    mainHandler.post { if (!released) block() }
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

package com.reactnative

import android.content.Context
import android.view.SurfaceView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer

/** Mirrors `PlayerEvent['type']` in `src/NativePlayerStore.ts`. */
internal enum class PlayerEventType(val jsName: String) {
  PLAYING("playing"),
  PAUSED("paused"),
  ENDED("ended"),
}

/**
 * One `ExoPlayer` behind one handle. Confined to the main thread — every entry
 * point is reached either from [PlayerRegistry]'s main-looper dispatch or from
 * the Fabric surface, which is already on the UI thread.
 */
internal class PlayerEngine(
  context: Context,
  source: String,
  private val onEvent: (PlayerEventType) -> Unit,
) {
  private val exo = ExoPlayer.Builder(context).build()

  // The engine renders into the most recently attached surface only. Lower
  // entries stay registered so a pop can fall back without the surface below
  // having to re-register.
  private val surfaces = ArrayDeque<SurfaceView>()

  init {
    exo.addListener(
      object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
          onEvent(if (isPlaying) PlayerEventType.PLAYING else PlayerEventType.PAUSED)
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
          if (playbackState == Player.STATE_ENDED) onEvent(PlayerEventType.ENDED)
        }
      }
    )

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
    surfaces.clear()
    exo.release()
  }
}

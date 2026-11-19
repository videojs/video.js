package com.reactnative

/**
 * One player's state as an `HTMLMediaElement` would report it, property for
 * property. Immutable: [PlayerEngine] changes it by replacing it with an edited
 * `copy()`, so a reader never sees half an update. The defaults are a media
 * element's initial values, which is also what a reset restores.
 */
internal data class PlayerState(
  /** Seconds. */
  val currentTime: Double = 0.0,
  /** Seconds; NaN until known, infinite for live. */
  val duration: Double = Double.NaN,
  val buffered: List<PlayerTimeRange> = emptyList(),
  val seekable: List<PlayerTimeRange> = emptyList(),
  val error: PlayerError? = null,
  val paused: Boolean = true,
  val ended: Boolean = false,
  val seeking: Boolean = false,
  val currentSrc: String = "",
  val readyState: Int = 0,
  val playbackRate: Double = 1.0,
  val contentData: PlayerContentData = PlayerContentData(),
)

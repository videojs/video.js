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

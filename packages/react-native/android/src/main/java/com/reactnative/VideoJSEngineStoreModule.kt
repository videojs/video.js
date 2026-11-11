package com.reactnative

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

/**
 * The single control interface: engines addressed by handle, plus one event
 * channel tagged by handle that the JS adapter demuxes. Deliberately
 * view-independent so a player stays controllable with no surface mounted.
 */
@ReactModule(name = VideoJSEngineStoreModule.NAME)
class VideoJSEngineStoreModule internal constructor(
  reactContext: ReactApplicationContext,
  private val registry: PlayerRegistry,
) : NativeEngineStoreSpec(reactContext) {
  init {
    registry.onEvent = ::emitPlayerEvent
  }

  override fun createPlayer(source: String?): Double =
    registry.create(reactApplicationContext, source).toDouble()

  override fun destroyPlayer(handle: Double) {
    registry.destroy(handle.toInt())
  }

  override fun setSource(handle: Double, source: String): Boolean =
    registry.command(handle.toInt(), { it.requestSource(source) }) { it.setSource(source) }

  override fun play(handle: Double): Boolean =
    registry.command(handle.toInt(), PlayerEngine::requestPlay, PlayerEngine::play)

  override fun load(handle: Double): Boolean =
    registry.command(handle.toInt(), PlayerEngine::requestLoad, PlayerEngine::load)

  override fun pause(handle: Double): Boolean =
    registry.command(handle.toInt(), PlayerEngine::requestPause, PlayerEngine::pause)

  override fun setCurrentTime(handle: Double, time: Double): Boolean =
    registry.command(handle.toInt(), { it.requestSeek(time) }) { it.setCurrentTime(time) }

  override fun getCurrentTime(handle: Double): Double = state(handle).currentTime

  override fun getDuration(handle: Double): Double = state(handle).duration

  override fun getBuffered(handle: Double): WritableArray = toTimeRangesArray(state(handle).buffered)

  override fun getSeekable(handle: Double): WritableArray = toTimeRangesArray(state(handle).seekable)

  override fun getError(handle: Double): WritableMap? = state(handle).error?.let(::toErrorMap)

  override fun isPaused(handle: Double): Boolean = state(handle).paused

  override fun isEnded(handle: Double): Boolean = state(handle).ended

  override fun isSeeking(handle: Double): Boolean = state(handle).seeking

  override fun getSource(handle: Double): String = state(handle).currentSrc

  override fun getReadyState(handle: Double): Double = state(handle).readyState.toDouble()

  override fun getContentData(handle: Double): WritableMap = toContentDataMap(state(handle).contentData)

  override fun getPlaybackRate(handle: Double): Double = state(handle).playbackRate

  override fun invalidate() {
    registry.onEvent = null
    registry.releaseAll()
    super.invalidate()
  }

  private fun emitPlayerEvent(handle: Int, event: PlayerEvent) {
    emitOnPlayerEvent(
      Arguments.createMap().apply {
        putInt("handle", handle)
        putString("type", event.type.jsName)
        event.currentTime?.let { putDouble("currentTime", it) }
        event.duration?.let { putDouble("duration", it) }

        event.buffered?.let { putArray("buffered", toTimeRangesArray(it)) }
        event.error?.let { putMap("error", toErrorMap(it)) }
      }
    )
  }

  private fun state(handle: Double): PlayerState = registry.state(handle.toInt())

  companion object {
    const val NAME = "VideoJSEngineStore"
  }
}

private fun toTimeRangesArray(ranges: List<PlayerTimeRange>): WritableArray =
  Arguments.createArray().apply {
    ranges.forEach { range ->
      pushMap(
        Arguments.createMap().apply {
          putDouble("start", range.start)
          putDouble("end", range.end)
        }
      )
    }
  }

private fun toErrorMap(error: PlayerError): WritableMap =
  Arguments.createMap().apply {
    putInt("code", error.code)
    putString("message", error.message)
  }

private fun toContentDataMap(contentData: PlayerContentData): WritableMap =
  Arguments.createMap().apply {
    contentData.title?.let { putString("title", it) }
    contentData.poster?.let { putString("poster", it) }
  }

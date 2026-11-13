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
    registry.onChange = ::emitPlayerChange
  }

  override fun createPlayer(source: String?): Double =
    registry.create(reactApplicationContext, source).toDouble()

  override fun destroyPlayer(handle: Double) {
    registry.destroy(handle.toInt())
  }

  // Each returns its own update, or null when the handle has no live engine.

  override fun setSource(handle: Double, source: String): WritableMap? = command(handle) { it.setSource(source) }

  override fun play(handle: Double): WritableMap? = command(handle) { it.play() }

  override fun load(handle: Double): WritableMap? = command(handle) { it.load() }

  override fun pause(handle: Double): WritableMap? = command(handle) { it.pause() }

  override fun setCurrentTime(handle: Double, time: Double): WritableMap? = command(handle) { it.setCurrentTime(time) }

  override fun setPlaybackRate(handle: Double, rate: Double): WritableMap? = command(handle) { it.setPlaybackRate(rate) }

  override fun setLoop(handle: Double, loop: Boolean): WritableMap? = command(handle) { it.setLoop(loop) }

  override fun getState(handle: Double): WritableMap = toUpdateMap(registry.update(handle.toInt()))

  override fun invalidate() {
    registry.onChange = null
    registry.releaseAll()
    super.invalidate()
  }

  private fun emitPlayerChange(handle: Int, change: MediaChange) {
    emitOnPlayerChange(toUpdateMap(change).apply { putInt("handle", handle) })
  }

  private fun command(handle: Double, block: (PlayerEngine) -> MediaChange): WritableMap? =
    registry.engine(handle.toInt())?.let(block)?.let(::toUpdateMap)

  companion object {
    const val NAME = "VideoJSEngineStore"
  }
}

private fun toUpdateMap(change: MediaChange): WritableMap =
  Arguments.createMap().apply {
    putDouble("version", change.version.toDouble())
    putMap("patch", toPatchMap(change.patch))
    putArray("events", Arguments.createArray().apply { change.events.forEach { pushString(it.type.jsName) } })
  }

// Keys are `PlayerState` property names; see `patch` in MediaModel.kt.
@Suppress("UNCHECKED_CAST")
private fun toPatchMap(patch: Map<String, Any?>): WritableMap =
  Arguments.createMap().apply {
    for ((key, value) in patch) {
      when (value) {
        null -> putNull(key)
        is Double -> putDouble(key, value)
        is Int -> putInt(key, value)
        is Boolean -> putBoolean(key, value)
        is String -> putString(key, value)
        is PlayerError -> putMap(key, toErrorMap(value))
        is PlayerContentData -> putMap(key, toContentDataMap(value))
        is List<*> -> putArray(key, toTimeRangesArray(value as List<PlayerTimeRange>))
        else -> error("Unhandled patch value for '$key': $value")
      }
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

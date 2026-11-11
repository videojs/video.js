package com.reactnative

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
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

  override fun setSource(handle: Double, source: String) {
    registry.command(handle.toInt()) { it.setSource(source) }
  }

  override fun play(handle: Double) {
    registry.command(handle.toInt()) { it.play() }
  }

  override fun pause(handle: Double) {
    registry.command(handle.toInt()) { it.pause() }
  }

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

        event.buffered?.let { ranges ->
          putArray(
            "buffered",
            Arguments.createArray().apply {
              ranges.forEach { range ->
                pushMap(
                  Arguments.createMap().apply {
                    putDouble("start", range.start)
                    putDouble("end", range.end)
                  }
                )
              }
            },
          )
        }

        event.error?.let { error ->
          putMap(
            "error",
            Arguments.createMap().apply {
              putInt("code", error.code)
              putString("message", error.message)
            },
          )
        }
      }
    )
  }

  companion object {
    const val NAME = "VideoJSEngineStore"
  }
}

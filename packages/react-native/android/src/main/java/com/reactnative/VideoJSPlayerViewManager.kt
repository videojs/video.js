package com.reactnative

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.VideoJSPlayerViewManagerDelegate
import com.facebook.react.viewmanagers.VideoJSPlayerViewManagerInterface

@ReactModule(name = VideoJSPlayerViewManager.NAME)
class VideoJSPlayerViewManager internal constructor(
  private val registry: PlayerRegistry,
) : SimpleViewManager<VideoJSPlayerView>(),
  VideoJSPlayerViewManagerInterface<VideoJSPlayerView> {
  private val mDelegate: ViewManagerDelegate<VideoJSPlayerView> =
    VideoJSPlayerViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<VideoJSPlayerView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): VideoJSPlayerView {
    return VideoJSPlayerView(context, registry)
  }

  @ReactProp(name = "playerHandle")
  override fun setPlayerHandle(view: VideoJSPlayerView, value: Int) {
    // The generated delegate substitutes 0 for an absent prop; handles are
    // allocated from 1, so 0 is unambiguously "no player".
    view.setHandle(value.takeIf { it != 0 })
  }

  override fun onDropViewInstance(view: VideoJSPlayerView) {
    view.setHandle(null)
    super.onDropViewInstance(view)
  }

  companion object {
    const val NAME = "VideoJSPlayerView"
  }
}

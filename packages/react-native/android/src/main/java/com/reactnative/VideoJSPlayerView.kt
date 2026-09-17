package com.reactnative

import android.content.Context
import android.view.SurfaceView
import android.widget.FrameLayout

/**
 * A window onto an engine owned by [VideoJSEngineStoreModule]. Holds no
 * playback state and issues no commands — it registers its surface with the
 * engine for the handle it is given and renders whatever that engine plays.
 */
class VideoJSPlayerView internal constructor(
  context: Context,
  private val registry: PlayerRegistry,
) : FrameLayout(context) {
  private val surfaceView = SurfaceView(context)

  private var handle: Int? = null

  private val measureAndLayout = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  init {
    surfaceView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(surfaceView)
  }

  fun setHandle(next: Int?) {
    if (next == handle) return

    handle?.let { registry.engine(it)?.detachSurface(surfaceView) }
    handle = next
    next?.let { registry.engine(it)?.attachSurface(surfaceView) }
  }

  // React Native drives layout from the shadow tree and discards requests that
  // originate below a Fabric view, so the SurfaceView child would never be
  // re-laid-out on its own. Force a pass ourselves.
  override fun requestLayout() {
    super.requestLayout()
    removeCallbacks(measureAndLayout)
    post(measureAndLayout)
  }
}

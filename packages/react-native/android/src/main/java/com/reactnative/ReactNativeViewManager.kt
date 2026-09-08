package com.reactnative

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.ReactNativeViewManagerInterface
import com.facebook.react.viewmanagers.ReactNativeViewManagerDelegate

@ReactModule(name = ReactNativeViewManager.NAME)
class ReactNativeViewManager : SimpleViewManager<ReactNativeView>(),
  ReactNativeViewManagerInterface<ReactNativeView> {
  private val mDelegate: ViewManagerDelegate<ReactNativeView>

  init {
    mDelegate = ReactNativeViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<ReactNativeView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): ReactNativeView {
    return ReactNativeView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: ReactNativeView?, color: Int?) {
    view?.setBackgroundColor(color ?: Color.TRANSPARENT)
  }

  companion object {
    const val NAME = "ReactNativeView"
  }
}

package com.reactnative

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class ReactNativeViewPackage : BaseReactPackage() {
  // One registry per package instance, shared by the control module and the
  // surface so the Fabric view can resolve a handle without going through JS.
  private val playerRegistry = PlayerRegistry()

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf(ReactNativeViewManager(), VideoJSPlayerViewManager(playerRegistry))
  }

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      VideoJSPlayerStoreModule.NAME -> VideoJSPlayerStoreModule(reactContext, playerRegistry)
      else -> null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      VideoJSPlayerStoreModule.NAME to
        ReactModuleInfo(
          VideoJSPlayerStoreModule.NAME,
          VideoJSPlayerStoreModule.NAME,
          /* canOverrideExistingModule = */ false,
          /* needsEagerInit = */ false,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}

package com.reactnative

import android.content.Context
import android.os.Handler
import android.os.Looper
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * Owns the engines addressed by handle, shared between the control TurboModule
 * and the Fabric surface so neither has to reach through the other.
 *
 * `createPlayer` and the commands are synchronous methods, so they land on the
 * JS thread. The engine is built there, before `createPlayer` returns, so a
 * command issued in the same tick finds it; each engine posts its own player
 * work to the main looper.
 *
 * The synchronous getters also land on the JS thread, so the engine map is
 * readable from any thread; each engine guards its own state.
 */
internal class PlayerRegistry {
  private val nextHandle = AtomicInteger(1)
  private val mainHandler = Handler(Looper.getMainLooper())
  private val engines = ConcurrentHashMap<Int, PlayerEngine>()

  var onChange: ((handle: Int, change: MediaChange) -> Unit)? = null

  fun create(context: Context, source: String?): Int {
    val handle = nextHandle.getAndIncrement()

    engines[handle] = PlayerEngine(context, source) { change -> onChange?.invoke(handle, change) }

    return handle
  }

  /**
   * Unreachable by handle at once; released on the main thread behind any
   * player work its commands already posted.
   */
  fun destroy(handle: Int) {
    val engine = engines.remove(handle) ?: return

    mainHandler.post { engine.release() }
  }

  /**
   * From any thread. Null once the handle is destroyed, so a command for it
   * does nothing.
   */
  fun engine(handle: Int): PlayerEngine? = engines[handle]

  /** All of the latest state as one update, from any thread. A destroyed handle reads as a fresh player. */
  fun update(handle: Int): MediaChange = engines[handle]?.readUpdate() ?: MediaChange(0, fullPatch(PlayerState()), emptyList())

  fun releaseAll() {
    engines.keys.forEach(::destroy)
  }
}

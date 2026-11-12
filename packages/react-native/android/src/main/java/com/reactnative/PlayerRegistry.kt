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

  var onEvent: ((handle: Int, event: PlayerEvent) -> Unit)? = null

  fun create(context: Context, source: String?): Int {
    val handle = nextHandle.getAndIncrement()

    engines[handle] = PlayerEngine(context, source) { event -> onEvent?.invoke(handle, event) }

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

  /** The latest published state, from any thread. A destroyed handle reads as a fresh player. */
  fun state(handle: Int): PlayerState = engines[handle]?.readState() ?: PlayerState()

  fun releaseAll() {
    engines.keys.forEach(::destroy)
  }
}

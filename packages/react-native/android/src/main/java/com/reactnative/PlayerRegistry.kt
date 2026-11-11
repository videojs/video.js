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
 * `createPlayer` is a blocking synchronous method, so it lands on the JS thread
 * while `ExoPlayer` is confined to the main thread. Handle allocation happens
 * on the caller's thread (cheap, atomic) and every engine touch is posted to the
 * main looper. Because posts are FIFO, a command issued in the same tick as
 * `createPlayer` runs after construction rather than against a missing engine —
 * the queueing the design requires falls out of the looper.
 *
 * The synchronous getters also land on the JS thread, so the engine map is
 * readable from any thread; each engine guards its own state.
 */
internal class PlayerRegistry {
  private val nextHandle = AtomicInteger(1)
  private val mainHandler = Handler(Looper.getMainLooper())

  /** Written on the main thread; read from any. */
  private val engines = ConcurrentHashMap<Int, PlayerEngine>()

  var onEvent: ((handle: Int, event: PlayerEvent) -> Unit)? = null

  fun create(context: Context, source: String?): Int {
    val handle = nextHandle.getAndIncrement()

    onMain {
      engines[handle] = PlayerEngine(context, source) { event -> onEvent?.invoke(handle, event) }
    }

    return handle
  }

  fun destroy(handle: Int) {
    onMain { engines.remove(handle)?.release() }
  }

  /**
   * A command that changes state: [request] writes the state it will produce,
   * from the calling thread so getters reflect it at once, then [block] runs
   * on the main thread. Before the engine exists there is nothing to write to
   * yet, so the request runs on the main thread just ahead of [block] instead.
   *
   * Returns whether the request ran on the calling thread.
   */
  fun command(handle: Int, request: (PlayerEngine) -> Unit, block: (PlayerEngine) -> Unit): Boolean {
    val requested = engines[handle]?.also(request) != null

    onMain {
      engines[handle]?.let {
        if (!requested) request(it)
        block(it)
      }
    }

    return requested
  }

  /**
   * The latest published state, from any thread. A handle whose engine doesn't
   * exist — not built yet, or destroyed — reads as a fresh player.
   */
  fun state(handle: Int): PlayerState = engines[handle]?.readState() ?: PlayerState()

  /**
   * Synchronous lookup for the Fabric surface. Safe because the surface only
   * mounts after `createPlayer` returned, so the construction post is already
   * ahead of it in the main-looper queue.
   */
  fun engine(handle: Int): PlayerEngine? = engines[handle]

  fun releaseAll() {
    onMain {
      engines.values.forEach { it.release() }
      engines.clear()
    }
  }

  // Always posts, never runs inline on the main thread — inlining would let a
  // command overtake a still-queued construction.
  private fun onMain(block: () -> Unit) {
    mainHandler.post(block)
  }
}

package com.reactnative

import android.content.Context
import android.os.Handler
import android.os.Looper
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
 */
internal class PlayerRegistry {
  private val nextHandle = AtomicInteger(1)
  private val mainHandler = Handler(Looper.getMainLooper())

  /** Main-thread only. */
  private val engines = mutableMapOf<Int, PlayerEngine>()

  var onEvent: ((handle: Int, type: PlayerEventType) -> Unit)? = null

  fun create(context: Context, source: String): Int {
    val handle = nextHandle.getAndIncrement()

    onMain {
      engines[handle] = PlayerEngine(context, source) { type -> onEvent?.invoke(handle, type) }
    }

    return handle
  }

  fun destroy(handle: Int) {
    onMain { engines.remove(handle)?.release() }
  }

  fun command(handle: Int, block: (PlayerEngine) -> Unit) {
    onMain { engines[handle]?.let(block) }
  }

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

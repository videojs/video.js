import { listen } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/define-behavior';
import { effect } from '../../../core/signals/effect';
import type { ReadonlySignal } from '../../../core/signals/primitives';
import { getMinBufferedEnd } from '../../../media/dom/mse/duration';

export interface RecoverEndStallContext {
  mediaElement?: HTMLMediaElement | undefined;
  mediaSource?: MediaSource | undefined;
}

export interface RecoverEndStallConfig {
  /**
   * How close (seconds) the playhead must be to the reachable buffered end for a `waiting` to count as the
   * end-of-stream freeze. Must exceed the audio-clock freeze gap (~50–70ms measured on Chrome); too small risks missing
   * the stall (a permanent hang), so keep a margin. Default {@link DEFAULT_END_STALL_NUDGE_WINDOW}.
   */
  endStallNudgeWindow?: number;
}

/** ~2.8× the measured max freeze gap (71ms) — tight, but with headroom against a miss. */
export const DEFAULT_END_STALL_NUDGE_WINDOW = 0.2;

/**
 * Whether a `waiting` should be forced to `ended`: the MediaSource is `ended`, the stream is finite (not live),
 * playback is active (not paused/seeking/already-ended), and the playhead sits within `nudgeWindow` of the reachable
 * buffered end (so it's the true end, not a mid-stream buffer hole). Pure — the behavior supplies the live values.
 */
function shouldForceEnded(
  input: {
    msEnded: boolean;
    durationFinite: boolean;
    paused: boolean;
    seeking: boolean;
    ended: boolean;
    currentTime: number;
    bufferedEnd: number | undefined;
  },
  nudgeWindow: number
): boolean {
  const { msEnded, durationFinite, paused, seeking, ended, currentTime, bufferedEnd } = input;
  if (!msEnded || !durationFinite || paused || seeking || ended || bufferedEnd === undefined) return false;

  const gap = bufferedEnd - currentTime;

  // getMinBufferedEnd returns 0 when no media is buffered.
  return bufferedEnd > 0 && gap >= 0 && gap < nudgeWindow;
}

function recoverEndStallSetup({
  context,
  config,
}: {
  context: {
    mediaElement: ReadonlySignal<RecoverEndStallContext['mediaElement']>;
    mediaSource: ReadonlySignal<RecoverEndStallContext['mediaSource']>;
  };
  config?: RecoverEndStallConfig;
}): () => void {
  const nudgeWindow = config?.endStallNudgeWindow ?? DEFAULT_END_STALL_NUDGE_WINDOW;

  return effect(() => {
    const mediaElement = context.mediaElement.get();
    if (!mediaElement) return;

    const onWaiting = () => {
      const mediaSource = context.mediaSource.get();
      const forceEnded = shouldForceEnded(
        {
          msEnded: mediaSource?.readyState === 'ended',
          durationFinite: Number.isFinite(mediaElement.duration),
          paused: mediaElement.paused,
          seeking: mediaElement.seeking,
          ended: mediaElement.ended,
          currentTime: mediaElement.currentTime,
          bufferedEnd: mediaSource ? getMinBufferedEnd(mediaSource.sourceBuffers) : undefined,
        },
        nudgeWindow
      );

      // Nudge to `duration` → native `ended` (the seeking/ended guards above prevent a
      // re-fire while the nudge-seek is in flight, so no latch is needed).
      if (forceEnded) mediaElement.currentTime = mediaElement.duration;
    };

    return listen(mediaElement, 'waiting', onWaiting);
  });
}

/**
 * Recover the end-of-stream stall that Chrome exhibits on skewed A/V. After `endOfStream`, when the audio and video
 * tracks end a few ms apart (e.g. a source with an A/V PTS skew), Chrome's audio-clock-paced playback freezes the
 * playhead ~50–70ms short of the reachable buffered end and never fires `ended` — so playback hangs at the very end and
 * loop never re-triggers. This behavior watches for the `waiting` event that fires at that freeze and, when the
 * MediaSource is `ended` and the playhead sits at the reachable buffered end, nudges `currentTime` to `duration` to
 * force the native `ended`.
 *
 * **Event-driven, no poll.** `waiting` fires at the instant the playhead stalls (measured ~0ms latency), so there's
 * nothing to gain from polling — and polling would add its interval + a stall threshold before reacting.
 *
 * **Proximity to the _reachable_ buffered end** is the discriminator. That end is
 * `getMinBufferedEnd(mediaSource.sourceBuffers)` — the `min` of the per-track (video/audio) SourceBuffer ends, i.e. the
 * furthest point playback can reach — read from the SourceBuffers directly rather than the `mediaElement.buffered`
 * aggregate. Once `endOfStream` is signalled that's the true content end. Requiring the playhead within
 * `endStallNudgeWindow` of it distinguishes the real end-of-stream freeze from a mid-stream buffer-hole stall (which
 * sits far from the buffered end), so we never skip content. The window must exceed the freeze gap; too small would
 * miss the stall (a permanent hang), so the default is generous relative to the measured gap and is config-tunable for
 * empirical tuning.
 *
 * Inert where it shouldn't act: live (the MediaSource never reaches `ended` while the window grows; `duration` is
 * `Infinity`) and streams that end cleanly (no `waiting`).
 *
 * See `internal/decisions/spf/end-of-stream-av-skew-recovery.md`.
 */
export const recoverEndStall = defineBehavior({
  stateKeys: [] as const,
  contextKeys: ['mediaElement', 'mediaSource'] as const,
  setup: recoverEndStallSetup,
});

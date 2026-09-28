import { describe, expect, it } from 'vite-plus/test';

import { effect } from '../effect';
import { computed, signal } from '../primitives';

// Drain microtasks so signal-driven re-runs land before assertions.
const flush = () => Promise.resolve().then(() => Promise.resolve());

describe('effect', () => {
  describe('self-write through an intermediate computed (lost-wakeup regression)', () => {
    // An effect body may write a signal that an intermediate computed in its
    // own dependency graph reads (the concrete SPF shape: a track-selection
    // effect writing `selected*TrackId`, which the candidate-set computed's
    // `stickToSelectedCodecs` constraint reads). The write dirties the
    // intermediate mid-run with no watcher notification; unless the run
    // revalidates its sources (`revalidateSources` in `effect.ts`), later
    // external changes routed through that intermediate are deduped against
    // the standing dirty flag and the effect goes deaf on that path. These
    // tests pin the recovery for both places a run can happen.
    //
    // The guarantee is *liveness*, not immediacy: the effect is not re-run
    // just because it wrote into its own graph (deliberately — that would
    // double-run every writing effect); it catches up on the next genuine
    // change through the path.
    it('recovers when the self-write happens during the initial run', async () => {
      const external = signal(1);
      const own = signal<string | undefined>(undefined);
      const inter = computed(() => `${external.get()}:${own.get() ?? 'none'}`);
      const runs: string[] = [];
      const stop = effect(() => {
        runs.push(inter.get());

        if (own.get() === undefined) own.set('locked');
      });

      await flush();
      external.set(2);
      await flush();
      // The external change routed through the self-written intermediate
      // still wakes the effect.
      expect(runs.at(-1)).toBe('2:locked');
      stop();
    });

    it('recovers when the self-write happens during a flush run', async () => {
      const external = signal(1);
      const trigger = signal(0);
      const own = signal<string | undefined>(undefined);
      const inter = computed(() => `${external.get()}:${own.get() ?? 'none'}`);
      const runs: string[] = [];
      const stop = effect(() => {
        const shouldWrite = trigger.get() === 1;

        runs.push(inter.get());

        if (shouldWrite && own.get() === undefined) own.set('locked');
      });

      await flush();
      trigger.set(1); // this flush run performs the self-write
      await flush();
      external.set(2);
      await flush();
      expect(runs.at(-1)).toBe('2:locked');
      stop();
    });

    it('converges — a settled self-write causes no further re-runs', async () => {
      const own = signal<string | undefined>(undefined);
      const inter = computed(() => own.get() ?? 'none');
      let runCount = 0;
      const stop = effect(() => {
        inter.get();
        runCount++;

        if (own.get() === undefined) own.set('locked');
      });

      await flush();
      await flush();
      const settled = runCount;

      await flush();
      // No dirty dependency left behind → no phantom re-runs.
      expect(runCount).toBe(settled);
      stop();
    });
  });
});

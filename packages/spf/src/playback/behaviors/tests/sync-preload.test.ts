import { describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../core/composition/create-composition';
import { effect } from '../../../core/signals/effect';
import { signal } from '../../../core/signals/primitives';
import type { MaybeResolvedPresentation, MediaElementLike } from '../../../media/types';
import type { PresentationState } from '../resolve-presentation';
import { syncPreload } from '../sync-preload';

interface State {
  preload?: PresentationState['preload'];
  presentation?: MaybeResolvedPresentation | undefined;
}

interface Context {
  mediaElement?: MediaElementLike | undefined;
}

function makeState(initial: State = {}): StateSignals<PresentationState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    preload: signal<PresentationState['preload']>(initial.preload),
    loadActivated: signal<boolean | undefined>(undefined),
  };
}

function makeContext(initial: Context = {}): ContextSignals<Context> {
  return { mediaElement: signal<MediaElementLike | undefined>(initial.mediaElement) };
}

describe('syncPreload', () => {
  describe('read (DOM → state)', () => {
    it('copies mediaElement.preload to state on initial setup', () => {
      const state = makeState();
      const context = makeContext({ mediaElement: { preload: 'auto' } });

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('auto');

      cleanup();
    });

    it('overwrites state when mediaElement swaps to a different W3C value', async () => {
      const state = makeState();
      const context = makeContext({ mediaElement: { preload: 'auto' } });

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('auto');

      context.mediaElement.set({ preload: 'metadata' });
      await vi.waitFor(() => {
        expect(state.preload.get()).toBe('metadata');
      });

      cleanup();
    });

    it('re-reads mediaElement.preload when state.presentation.url changes', async () => {
      const state = makeState({ presentation: { url: 'a.m3u8' } });
      const mediaElement: MediaElementLike = { preload: 'auto' };
      const context = makeContext({ mediaElement });

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('auto');

      // Host swaps source and updates the same element's preload attribute.
      mediaElement.preload = 'metadata';
      state.presentation.set({ url: 'b.m3u8' });

      await vi.waitFor(() => {
        expect(state.preload.get()).toBe('metadata');
      });

      cleanup();
    });

    // DOM-reflected elements (#2532): the `preload` IDL property reports a
    // browser-dependent UA default even when no attribute was authored, so the
    // read gates on `hasAttribute` when the element exposes it. Fakes below
    // model a real element: property always populated, attribute optional.
    describe('authored attribute gate (UA default is never a source)', () => {
      it('ignores the preload property when the element carries no preload attribute', () => {
        const state = makeState();
        // A bare shadow <video>: no attribute, property reports the UA default.
        const context = makeContext({ mediaElement: { preload: 'auto', hasAttribute: () => false } });

        const cleanup = syncPreload.setup({ state, context });

        // SPF's own default, not the element's UA default.
        expect(state.preload.get()).toBe('metadata');

        cleanup();
      });

      it('does not clobber a prior state.preload when an attribute-less element attaches', async () => {
        const state = makeState({ preload: 'none' });
        const context = makeContext();

        const cleanup = syncPreload.setup({ state, context });

        context.mediaElement.set({ preload: 'auto', hasAttribute: () => false });
        await Promise.resolve();

        expect(state.preload.get()).toBe('none');

        cleanup();
      });

      it('does not clobber state.preload on presentation.url change when the element has no preload attribute', async () => {
        const state = makeState({ preload: 'none', presentation: { url: 'a.m3u8' } });
        const mediaElement: MediaElementLike = { preload: 'auto', hasAttribute: () => false };
        const context = makeContext({ mediaElement });

        const cleanup = syncPreload.setup({ state, context });

        // Restore a conflicting property after setup's state-to-DOM write.
        mediaElement.preload = 'auto';
        state.presentation.set({ url: 'b.m3u8' });
        await Promise.resolve();

        expect(state.preload.get()).toBe('none');

        cleanup();
      });

      it('adopts the preload property when the element carries a preload attribute (most-recent-wins on attach)', async () => {
        const state = makeState({ preload: 'none' });
        const context = makeContext();

        const cleanup = syncPreload.setup({ state, context });

        context.mediaElement.set({ preload: 'auto', hasAttribute: (name) => name === 'preload' });

        await vi.waitFor(() => {
          expect(state.preload.get()).toBe('auto');
        });

        cleanup();
      });
    });

    it('does not clear state.preload when mediaElement is removed', async () => {
      const state = makeState();
      const context = makeContext({ mediaElement: { preload: 'auto' } });

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('auto');
      context.mediaElement.set(undefined);
      await Promise.resolve();

      expect(state.preload.get()).toBe('auto');

      cleanup();
    });

    it('does not re-trigger on external writes to state.preload (peek, not get)', async () => {
      const state = makeState();
      const context = makeContext({ mediaElement: { preload: 'auto' } });

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('auto');

      const seen: PresentationState['preload'][] = [];
      const stopObserve = effect(() => {
        seen.push(state.preload.get());
      });

      // External clear; read should NOT re-fire to re-seed 'auto'.
      state.preload.set(undefined);
      await Promise.resolve();
      expect(state.preload.get()).toBeUndefined();
      // Observer caught: initial 'auto', then external undefined. A re-seed
      // would have produced a third 'auto' entry — which is what we're
      // asserting we DON'T see.
      expect(seen).toEqual(['auto', undefined]);

      stopObserve();
      cleanup();
    });
  });

  describe('write (state → DOM)', () => {
    it('writes state.preload to mediaElement when set externally', async () => {
      const mediaElement: MediaElementLike = { preload: '' };
      const state = makeState();
      const context = makeContext({ mediaElement });

      const cleanup = syncPreload.setup({ state, context });

      // 'auto' differs from both the default backfill ('metadata') and the
      // mediaElement's empty attribute, so we can isolate the write path.
      state.preload.set('auto');
      await vi.waitFor(() => {
        expect(mediaElement.preload).toBe('auto');
      });

      cleanup();
    });

    it('pushes state.preload to a freshly-attached mediaElement that has no preload attribute', async () => {
      const state = makeState({ preload: 'none' });
      const context = makeContext();

      const cleanup = syncPreload.setup({ state, context });

      // No preload attribute on the host element — DOM has no W3C opinion,
      // so the write side wins and pushes state to the DOM.
      const mediaElement: MediaElementLike = { preload: '' };

      context.mediaElement.set(mediaElement);

      await vi.waitFor(() => {
        expect(mediaElement.preload).toBe('none');
      });

      cleanup();
    });
  });

  describe('config.defaultPreload', () => {
    it("backfills state.preload to 'metadata' (default-default) when DOM has no W3C value and state is undefined", () => {
      const state = makeState();
      const context = makeContext();

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('metadata');

      cleanup();
    });

    it('backfills state.preload to the configured defaultPreload when DOM has no W3C value', () => {
      const state = makeState();
      const context = makeContext();

      const cleanup = syncPreload.setup({ state, context, config: { defaultPreload: 'none' } });

      expect(state.preload.get()).toBe('none');

      cleanup();
    });

    it("backfills when the mediaElement's preload attribute is empty (non-W3C)", () => {
      const state = makeState();
      const context = makeContext({ mediaElement: { preload: '' } });

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('metadata');

      cleanup();
    });

    it('does not override a pre-set W3C state.preload with the default', () => {
      const state = makeState({ preload: 'auto' });
      const context = makeContext();

      const cleanup = syncPreload.setup({ state, context, config: { defaultPreload: 'none' } });

      expect(state.preload.get()).toBe('auto');

      cleanup();
    });

    it('re-applies default on the next presentation.url change after an external clear (self-heal via URL trigger)', async () => {
      const state = makeState();
      const context = makeContext();

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('metadata');

      state.preload.set(undefined);
      await Promise.resolve();
      expect(state.preload.get()).toBeUndefined();

      state.presentation.set({ url: 'a.m3u8' });
      await vi.waitFor(() => {
        expect(state.preload.get()).toBe('metadata');
      });

      cleanup();
    });
  });

  describe('extended values (e.g. canplay)', () => {
    // `PresentationState['preload']` is currently typed to the W3C union;
    // a follow-up will widen the type to allow extended values. Until then,
    // the behavior already supports them at runtime — cast in tests.
    const EXTENDED = 'canplay' as unknown as PresentationState['preload'];

    it('preserves extended state.preload across mediaElement swap (read skips)', async () => {
      const state = makeState({ preload: EXTENDED });
      const context = makeContext({ mediaElement: { preload: 'auto' } });

      const cleanup = syncPreload.setup({ state, context });

      // Initial fire: read sees state.preload is extended → skip.
      expect(state.preload.get()).toBe('canplay');

      context.mediaElement.set({ preload: 'metadata' });
      // Give the effect a tick; nothing should have written.
      await Promise.resolve();
      expect(state.preload.get()).toBe('canplay');

      cleanup();
    });

    it('does not push an extended state.preload to mediaElement (write skips)', async () => {
      const mediaElement: MediaElementLike = { preload: 'auto' };
      const state = makeState();
      const context = makeContext({ mediaElement });

      const cleanup = syncPreload.setup({ state, context });

      state.preload.set(EXTENDED);
      await Promise.resolve();
      expect(mediaElement.preload).toBe('auto');

      cleanup();
    });
  });

  describe('dedup', () => {
    it('does not write mediaElement.preload when state.preload matches', async () => {
      const mediaElement: MediaElementLike = { preload: 'auto' };
      const state = makeState({ preload: 'auto' });
      const context = makeContext({ mediaElement });

      let writes = 0;

      Object.defineProperty(mediaElement, 'preload', {
        get: () => 'auto',
        set: () => {
          writes += 1;
        },
        configurable: true,
      });

      const cleanup = syncPreload.setup({ state, context });

      state.preload.set('auto');
      await Promise.resolve();
      expect(writes).toBe(0);

      cleanup();
    });
  });

  describe('cleanup', () => {
    it('returns a cleanup that stops both effects', async () => {
      const mediaElement: MediaElementLike = { preload: 'auto' };
      const state = makeState();
      const context = makeContext({ mediaElement });

      const cleanup = syncPreload.setup({ state, context });

      expect(state.preload.get()).toBe('auto');
      cleanup();

      // After cleanup: neither direction should fire.
      mediaElement.preload = 'none';
      const replacement: MediaElementLike = { preload: 'metadata' };

      context.mediaElement.set(replacement);
      await Promise.resolve();
      expect(state.preload.get()).toBe('auto');

      state.preload.set('none');
      await Promise.resolve();
      expect(replacement.preload).toBe('metadata');
    });
  });
});

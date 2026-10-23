import { describe, expect, it } from 'vite-plus/test';

import type { StateSignals } from '../../../core/composition/define-behavior';
import { signal } from '../../../core/signals/primitives';
import type { MaybeResolvedPresentation, PartiallyResolvedVideoTrack, Presentation } from '../../../media/types';
import { type DeriveCdnPriorityState, deriveCdnPriority } from '../derive-cdn-priority';

function makeState(initial: Partial<DeriveCdnPriorityState> = {}): StateSignals<DeriveCdnPriorityState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    cdnPriority: signal<string[] | undefined>(initial.cdnPriority),
  };
}

const videoTrack = (id: string, url: string): PartiallyResolvedVideoTrack => ({
  type: 'video',
  codecs: [],
  id,
  url,
  bandwidth: 2_000_000,
  mimeType: 'video/mp4',
});

const presentationWith = (urls: string[], id = 'pres-1'): Presentation =>
  ({
    id,
    url: 'https://cdn-a.example.com/master.m3u8',
    selectionSets: [
      {
        id: 'video-set',
        type: 'video' as const,
        switchingSets: [
          { id: 'video-switching', type: 'video' as const, tracks: urls.map((u, i) => videoTrack(`v${i}`, u)) },
        ],
      },
    ],
  }) as Presentation;

// A redundant-streams presentation: each rendition duplicated across CDNs, in
// manifest priority order (cdn-a first).
const redundant = (id = 'pres-1'): Presentation =>
  presentationWith(
    [
      'https://cdn-a.example.com/720p.m3u8',
      'https://cdn-b.example.com/720p.m3u8',
      'https://cdn-a.example.com/1080p.m3u8',
      'https://cdn-b.example.com/1080p.m3u8',
    ],
    id
  );

const flush = () => Promise.resolve().then(() => Promise.resolve());

describe('deriveCdnPriority', () => {
  it('publishes the manifest-ordered CDN list on src load', async () => {
    const state = makeState({ presentation: redundant() });
    const reactor = deriveCdnPriority.setup({ state });

    await flush();
    expect(state.cdnPriority.get()).toEqual(['https://cdn-a.example.com', 'https://cdn-b.example.com']);
    reactor.destroy();
  });

  it('does not re-set the list when a resolved swap keeps the same CDNs', async () => {
    const state = makeState({ presentation: redundant() });
    const reactor = deriveCdnPriority.setup({ state });

    await flush();
    const first = state.cdnPriority.get();

    // Live-reload-style swap: new presentation object, same hosts.
    state.presentation.set(redundant('pres-2'));
    await flush();
    // Same reference — the no-churn guard skipped the write.
    expect(state.cdnPriority.get()).toBe(first);

    reactor.destroy();
  });

  it('updates the list when a resolved swap changes the CDN order', async () => {
    const state = makeState({ presentation: redundant() });
    const reactor = deriveCdnPriority.setup({ state });

    await flush();
    expect(state.cdnPriority.get()).toEqual(['https://cdn-a.example.com', 'https://cdn-b.example.com']);

    state.presentation.set(
      presentationWith(['https://cdn-b.example.com/720p.m3u8', 'https://cdn-a.example.com/720p.m3u8'], 'pres-2')
    );
    await flush();
    expect(state.cdnPriority.get()).toEqual(['https://cdn-b.example.com', 'https://cdn-a.example.com']);

    reactor.destroy();
  });

  it('clears cdnPriority on destroy', async () => {
    const state = makeState({ presentation: redundant() });
    const reactor = deriveCdnPriority.setup({ state });

    await flush();
    expect(state.cdnPriority.get()).toBeDefined();

    reactor.destroy();
    expect(state.cdnPriority.get()).toBeUndefined();
  });

  it('clears on unload and re-publishes for the next resolved source', async () => {
    const state = makeState({ presentation: redundant() });
    const reactor = deriveCdnPriority.setup({ state });

    await flush();
    expect(state.cdnPriority.get()).toEqual(['https://cdn-a.example.com', 'https://cdn-b.example.com']);

    state.presentation.set(undefined);
    await flush();
    expect(state.cdnPriority.get()).toBeUndefined();

    state.presentation.set(redundant('pres-2'));
    await flush();
    expect(state.cdnPriority.get()).toEqual(['https://cdn-a.example.com', 'https://cdn-b.example.com']);

    reactor.destroy();
  });
});

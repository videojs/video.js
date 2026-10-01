/**
 * The segment-load gate under its one hard case: `segmentLoadingBlocked` rising in the _same flush_ that resolves the
 * first encrypted rendition.
 *
 * `load-segments.test.ts` covers the gate as steady state — set before anything resolves, nothing dispatches. That
 * misses the only ordering production actually produces. `setupMediaKeys` raises the gate off `declaredDrmKeys`, which
 * counts keys on resolved tracks, so the gate and the first loadable track are driven by the same event. The machine
 * can commit to a dispatching state while the gate is still down and reach its handler after the gate is up.
 *
 * So this composes the two real behaviors over shared signals, in the engine's registration order, and asserts the
 * invariant the gate exists for: no segment load is dispatched for an encrypted source before its MediaKeys attach.
 */
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../../core/signals/primitives';
import { DEFAULT_KEY_SYSTEMS } from '../../../../media/dom/key-systems';
import type { MaybeResolvedPresentation } from '../../../../media/types';
import { loadVideoSegments } from '../load-segments';
import { setupMediaKeys } from '../setup-media-keys';

vi.mock('../../../../media/dom/eme', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../media/dom/eme')>();

  return {
    ...actual,
    requestKeySystemAccess: vi.fn(),
    attachMediaKeys: vi.fn(async () => undefined),
    fetchServerCertificate: vi.fn(async () => new Uint8Array([7, 7])),
  };
});

const { requestKeySystemAccess, attachMediaKeys } = await import('../../../../media/dom/eme');

const PSSH_BASE64 =
  'AAAAW3Bzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAADsIARIQAAAAAAAAAAAAAAAAAAAAABoNd2lkZXZpbmVfdGVzdCIQAAAAAAAAAAAAAAAAAAAAACo=';

/** A resolved video track that is both loadable and key-declaring — a real DRM rendition's shape. */
function encryptedPresentation(): MaybeResolvedPresentation {
  return {
    id: 'p1',
    url: 'https://example.com/multivariant.m3u8',
    startTime: 0,
    duration: 4,
    selectionSets: [
      {
        id: 'ss1',
        type: 'video' as const,
        switchingSets: [
          {
            id: 'sw1',
            type: 'video' as const,
            tracks: [
              {
                type: 'video' as const,
                id: 'track-1',
                url: 'https://example.com/v.m3u8',
                bandwidth: 1000,
                mimeType: 'video/mp4',
                codecs: ['avc1.4d401f'],
                initialization: { url: 'https://example.com/init.mp4' },
                segments: [{ id: 's0', url: 'https://example.com/0.m4s', startTime: 0, duration: 4 }],
                startTime: 0,
                duration: 4,
                metadata: {
                  mediaPlaylist: {
                    targetDuration: 4,
                    mediaSequence: 0,
                    endList: true,
                    keys: [
                      {
                        method: 'SAMPLE-AES',
                        uri: `data:text/plain;base64,${PSSH_BASE64}`,
                        keyFormat: 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  } as unknown as MaybeResolvedPresentation;
}

/** Composes both behaviors over one state map and records every dispatched load against the gate's value. */
function setupComposed({ withMediaKeys }: { withMediaKeys: boolean }) {
  const state = {
    presentation: signal<MaybeResolvedPresentation | undefined>(undefined),
    preload: signal<string | undefined>('auto'),
    currentTime: signal<number | undefined>(0),
    loadActivated: signal<boolean | undefined>(true),
    loadingSuspended: signal<boolean | undefined>(undefined),
    segmentLoadingBlocked: signal<boolean | undefined>(undefined),
    selectedVideoTrackId: signal<string | undefined>('track-1'),
    selectedAudioTrackId: signal<string | undefined>(undefined),
    selectedTextTrackId: signal<string | undefined>(undefined),
    negotiatedKeySystem: signal<string | undefined>(undefined),
    errors: signal<unknown>(undefined),
  };

  const dispatched: (boolean | undefined)[] = [];
  const loader = {
    send: (message: { type: string }) => {
      if (message.type === 'load') dispatched.push(state.segmentLoadingBlocked.get());
    },
  };

  const context = {
    mediaElement: signal<HTMLVideoElement | undefined>(document.createElement('video')),
    mediaKeys: signal<MediaKeys | undefined>(undefined),
    videoBufferActor: signal<unknown>({}),
    audioBufferActor: signal<unknown>(undefined),
    videoSegmentLoaderActor: signal<unknown>(loader),
    audioSegmentLoaderActor: signal<unknown>(undefined),
    textTrackSegmentLoaderActor: signal<unknown>(undefined),
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  // Registration order mirrors `engine.ts`: `setupMediaKeys` precedes the loaders.
  const reactors = withMediaKeys
    ? [
        setupMediaKeys.setup({
          state: state as any,
          context: context as any,
          config: {
            drm: { 'com.widevine.alpha': { licenseUrl: 'https://license.example.com/wv' } },
            keySystems: DEFAULT_KEY_SYSTEMS,
          } as any,
        }),
        loadVideoSegments.setup({ state: state as any, context: context as any }),
      ]
    : [loadVideoSegments.setup({ state: state as any, context: context as any })];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return { state, dispatched, destroy: () => reactors.forEach((reactor) => reactor.destroy()) };
}

async function settle() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('loadVideoSegments (encrypted-source load gate)', () => {
  beforeEach(() => {
    vi.mocked(requestKeySystemAccess).mockReset();
    vi.mocked(attachMediaKeys).mockReset().mockResolvedValue(undefined);
  });

  it('dispatches no load when the gate rises in the same flush that resolves the rendition', async () => {
    const { state, dispatched, destroy } = setupComposed({ withMediaKeys: true });

    state.presentation.set(encryptedPresentation());
    await settle();

    // The gate went up, and nothing was dispatched behind it. Before the guards
    // in the state handlers this dispatched one load with the gate already true.
    expect(state.segmentLoadingBlocked.get()).toBe(true);
    expect(dispatched).toEqual([]);

    destroy();
  });

  it('dispatches for the encrypted fixture when no behavior raises the gate', async () => {
    // Liveness control. Without it the assertion above passes for the wrong
    // reason: a harness that never dispatches proves nothing.
    const { state, dispatched, destroy } = setupComposed({ withMediaKeys: false });

    state.presentation.set(encryptedPresentation());
    await settle();

    expect(state.segmentLoadingBlocked.get()).toBeUndefined();
    expect(dispatched.length).toBeGreaterThan(0);

    destroy();
  });
});

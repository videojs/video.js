import { describe, expect, it, vi } from 'vite-plus/test';

import type { StateSignals } from '../../../core/composition/create-composition';
import { signal } from '../../../core/signals/primitives';
import { NO_KEY_SYSTEM } from '../../../media/drm';
import { SVTA_NO_SUPPORTED_AUDIO_TRACK, SVTA_NO_SUPPORTED_VIDEO_TRACK, type SvtaError } from '../../../media/errors';
import type {
  AudioSelectionSet,
  AudioTrack,
  MaybeResolvedPresentation,
  PartiallyResolvedTextTrack,
  PartiallyResolvedVideoTrack,
  Presentation,
  TextSelectionSet,
  TextTrack,
  VideoSelectionSet,
  VideoTrack,
} from '../../../media/types';
import { MEDIA_PLAYLIST_METADATA_KEY } from '../../../media/types';
import { applyContainerMimeType } from '../../../media/utils/tracks';
import type { BandwidthState } from '../../../network/bandwidth-estimator';
import { excludeRefusedKeySystems } from '../../primitives/selection-rules';
import {
  DEFAULT_VIDEO_CONSTRAINTS,
  type SwitchVideoTrackConfig,
  type SwitchVideoTrackRule,
  switchAudioTrack,
  switchTextTrack,
  switchVideoTrack,
} from '../track-switching';

// ============================================================================
// Test helpers
// ============================================================================

interface SwitchVideoTrackState {
  presentation?: MaybeResolvedPresentation;
  bandwidthState?: BandwidthState;
  selectedVideoTrackId?: string;
  userVideoTrackSelection?: Partial<VideoTrack>;
  playerResolution?: { readonly width: number; readonly height: number };
}

function makeState(initial: Partial<SwitchVideoTrackState> = {}): StateSignals<SwitchVideoTrackState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    bandwidthState: signal<BandwidthState | undefined>(initial.bandwidthState),
    selectedVideoTrackId: signal<string | undefined>(initial.selectedVideoTrackId),
    userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(initial.userVideoTrackSelection),
    playerResolution: signal<SwitchVideoTrackState['playerResolution']>(initial.playerResolution),
  };
}

const createVideoTrack = (id: string, bandwidth: number): PartiallyResolvedVideoTrack => ({
  type: 'video',
  codecs: [],
  id,
  url: `https://example.com/${id}.m3u8`,
  bandwidth,
  mimeType: 'video/mp4',
});

const createPresentation = (tracks: PartiallyResolvedVideoTrack[]): Presentation =>
  ({
    id: 'presentation-1',
    url: 'https://example.com/playlist.m3u8',
    selectionSets: [
      {
        id: 'video-set',
        type: 'video' as const,
        switchingSets: [
          {
            id: 'video-switching',
            type: 'video' as const,
            tracks,
          },
        ],
      } as VideoSelectionSet,
    ],
  }) as Presentation;

const createBandwidthState = (bps: number): BandwidthState => ({
  fastEstimate: bps,
  fastTotalWeight: 100,
  slowEstimate: bps,
  slowTotalWeight: 100,
  bytesSampled: 500_000,
});

// Drain microtasks so signal-driven re-runs land before assertions.
const flush = () => Promise.resolve().then(() => Promise.resolve());

const tracks = [
  createVideoTrack('360p', 600_000),
  createVideoTrack('720p', 2_400_000),
  createVideoTrack('1080p', 4_800_000),
];

// ============================================================================
// switchVideoTrack
// ============================================================================

describe('switchVideoTrack', () => {
  describe('lifecycle (presentation-unresolved ↔ presentation-resolved)', () => {
    it('clears selectedVideoTrackId on src unload', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(3_000_000),
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      state.presentation.set(undefined);
      await flush();
      expect(state.selectedVideoTrackId.get()).toBeUndefined();

      reactor.destroy();
    });

    it('clears selectedVideoTrackId on destroy', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(3_000_000),
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      reactor.destroy();
      // Destroy fires the 'presentation-resolved' entry's cleanup, which clears the slot.
      expect(state.selectedVideoTrackId.get()).toBeUndefined();
    });

    it('re-picks default after src reset (presentation undefined → new resolved)', async () => {
      const state = makeState({ presentation: createPresentation(tracks) });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      // initialBandwidth-driven default — see "default-pick" describe.
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      state.presentation.set(undefined);
      await flush();
      expect(state.selectedVideoTrackId.get()).toBeUndefined();

      const newPresentation = { ...createPresentation(tracks), id: 'pres-2' };

      state.presentation.set(newPresentation);
      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      reactor.destroy();
    });

    it('re-picks when the candidate set changes while staying resolved (constraint-readiness seam)', async () => {
      // The playable candidate set is derived in a `computed` the effect reads
      // reactively, so the pick updates whenever that set changes — not only on
      // an unresolved→resolved gate transition. This is what readies the
      // behavior for dynamic constraints (e.g. CDN failover) that re-prune the
      // set while a presentation stays resolved.
      const state = makeState({ presentation: createPresentation(tracks) });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      // Swap directly to a different resolved presentation (no undefined gap, so
      // the gate state stays 'presentation-resolved' and never re-enters).
      const narrowed = [createVideoTrack('480p', 1_200_000), createVideoTrack('540p', 1_500_000)];

      state.presentation.set({ ...createPresentation(narrowed), id: 'pres-2' });
      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('540p');

      reactor.destroy();
    });
  });

  describe('default-pick (no bandwidthState yet)', () => {
    it('picks the initialBandwidth-optimal track when bandwidthState is undefined and no selection', async () => {
      const state = makeState({ presentation: createPresentation(tracks) });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      // Default initialBandwidth is 5 Mbps; 1080p (4.8 Mbps) requires
      // 5.65 Mbps with safetyMargin 0.85, so the optimal is 720p.
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      reactor.destroy();
    });

    it('applies initialBandwidth-driven downgrade when bandwidthState is undefined', async () => {
      // 1080p preselected, but at default initialBandwidth (5 Mbps) the
      // optimal is 720p — so we downgrade immediately. Pre-refactor this
      // branch preserved the existing selection; that protective behavior
      // never fired in production (engine seeds bandwidthState) and is now
      // unified with the pre-trust path.
      const state = makeState({ presentation: createPresentation(tracks), selectedVideoTrackId: '1080p' });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      reactor.destroy();
    });
  });

  describe('userVideoTrackSelection (filter)', () => {
    it('locks to a specific track when filter narrows to exactly one candidate', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(6_000_000),
        userVideoTrackSelection: { id: '360p' },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      // Bandwidth would normally select 1080p, but the filter locks to 360p.
      expect(state.selectedVideoTrackId.get()).toBe('360p');

      reactor.destroy();
    });

    it('does not re-run ABR while filter narrows to exactly one (no bandwidth subscription)', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(3_000_000),
        userVideoTrackSelection: { id: '720p' },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      // Mutate bandwidth dramatically. Under the exact-1 short-circuit, the
      // effect doesn't subscribe to bandwidthState, so changes don't
      // re-fire it and the locked selection holds.
      const setSpy = vi.spyOn(state.selectedVideoTrackId, 'set');

      state.bandwidthState.set(createBandwidthState(6_000_000));
      await flush();
      state.bandwidthState.set(createBandwidthState(500_000));
      await flush();

      expect(state.selectedVideoTrackId.get()).toBe('720p');
      // The slot was not written during the bandwidth changes.
      expect(setSpy).not.toHaveBeenCalled();

      reactor.destroy();
    });

    it('resumes ABR when filter is cleared', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(6_000_000),
        userVideoTrackSelection: { id: '360p' },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('360p');

      state.userVideoTrackSelection.set(undefined);
      await flush();
      // ABR resumes, picks optimal at 6 Mbps.
      expect(state.selectedVideoTrackId.get()).toBe('1080p');

      reactor.destroy();
    });

    it('falls back to all tracks when filter matches no candidate', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(3_000_000),
        userVideoTrackSelection: { id: 'nonexistent-from-old-src' },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      // Filter matches zero tracks → fall back to full candidate set →
      // ABR picks optimal at 3 Mbps.
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      reactor.destroy();
    });

    it('runs ABR within filter when it narrows to multiple candidates', async () => {
      // Two tracks at the same height — a `{ height: 1080 }` filter would
      // narrow to both but not one. ABR picks among the matches.
      const t1080a = { ...createVideoTrack('1080-low', 3_000_000), height: 1080, width: 1920 };
      const t1080b = { ...createVideoTrack('1080-high', 5_500_000), height: 1080, width: 1920 };
      const outsider = { ...createVideoTrack('1440p', 6_500_000), height: 1440, width: 2560 };

      const state = makeState({
        presentation: createPresentation([outsider, t1080a, t1080b]),
        bandwidthState: createBandwidthState(8_000_000),
        userVideoTrackSelection: { height: 1080 },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      // All three fit; filtering must exclude the 6.5 Mbps outsider before ranking.
      expect(state.selectedVideoTrackId.get()).toBe('1080-high');

      reactor.destroy();
    });
  });

  describe('ABR downgrade', () => {
    it('downgrades immediately when bandwidth drops', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(3_000_000),
        selectedVideoTrackId: '720p',
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      state.bandwidthState.set(createBandwidthState(800_000));
      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('360p');

      reactor.destroy();
    });

    it('downgrades are not gated by upgradeMargin', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(6_000_000),
        selectedVideoTrackId: '360p',
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('1080p');

      state.bandwidthState.set(createBandwidthState(700_000));
      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('360p');

      reactor.destroy();
    });
  });

  describe('ABR upgrade', () => {
    it('applies upgrade when optimal exceeds current.bandwidth × upgradeMargin', async () => {
      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: createBandwidthState(3_000_000),
        selectedVideoTrackId: '720p',
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      state.bandwidthState.set(createBandwidthState(6_000_000));
      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('1080p');

      reactor.destroy();
    });

    it('skips upgrade when optimal is within upgradeMargin of current', async () => {
      // 1.0M → 1.1M is 10%, below the default 1.15 upgradeMargin → skip.
      const closeTracks = [createVideoTrack('low', 1_000_000), createVideoTrack('high', 1_100_000)];
      const state = makeState({
        presentation: createPresentation(closeTracks),
        bandwidthState: createBandwidthState(1_500_000),
        selectedVideoTrackId: 'low',
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('low');

      reactor.destroy();
    });
  });

  describe('equal-bitrate resolution tie-break', () => {
    const withResolution = (track: PartiallyResolvedVideoTrack, width: number, height: number) => ({
      ...track,
      width,
      height,
    });

    it.each([false, true])('prefers pixel area over width at equal bitrates (reversed: %s)', async (reversed) => {
      // Width and pixel area favor opposite tracks; neither width nor manifest
      // order should decide the fitting rendition's quality.
      const equalBitrate = [
        withResolution(createVideoTrack('wide', 2_000_000), 1920, 800),
        withResolution(createVideoTrack('tall', 2_000_000), 1280, 1440),
      ];
      const state = makeState({
        presentation: createPresentation(reversed ? [...equalBitrate].reverse() : equalBitrate),
        bandwidthState: createBandwidthState(2_500_000),
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('tall');

      reactor.destroy();
    });

    it('breaks ties by resolution among the smallest over-throughput renditions', async () => {
      // Both exceed the throughput threshold (equal, lowest bitrate) — the
      // fallback pick should still favor the higher-resolution variant.
      const overThreshold = [
        withResolution(createVideoTrack('sd', 8_000_000), 640, 360),
        withResolution(createVideoTrack('hd', 8_000_000), 1920, 1080),
      ];
      const state = makeState({
        presentation: createPresentation(overThreshold),
        bandwidthState: createBandwidthState(1_000_000),
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('hd');

      reactor.destroy();
    });
  });

  describe('playerResolutionCap (player-resolution cap)', () => {
    const sized = (id: string, bandwidth: number, width: number, height: number): PartiallyResolvedVideoTrack => ({
      ...createVideoTrack(id, bandwidth),
      width,
      height,
    });

    // 230_400 / 921_600 / 2_073_600 pixels.
    const ladder = [
      sized('360p', 600_000, 640, 360),
      sized('720p', 2_400_000, 1280, 720),
      sized('1080p', 4_800_000, 1920, 1080),
    ];

    // Enough headroom that the ranker would reach for 1080p unprompted, so any
    // lower pick below is the cap's doing and not the bandwidth threshold's.
    const ampleBandwidth = createBandwidthState(6_000_000);

    it('is inert without a measurement', async () => {
      const state = makeState({ presentation: createPresentation(ladder), bandwidthState: ampleBandwidth });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('1080p');

      reactor.destroy();
    });

    it('caps to the smallest covering tier, not the largest tier below the player', async () => {
      // An 800×450 player sits between 360p and 720p. Capping at-or-below the
      // player area would serve 360p and under-serve the display; the covering
      // tier is 720p.
      const state = makeState({
        presentation: createPresentation(ladder),
        bandwidthState: ampleBandwidth,
        playerResolution: { width: 800, height: 450 },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('720p');

      reactor.destroy();
    });

    it('does not cap when no rendition covers the player', async () => {
      const state = makeState({
        presentation: createPresentation(ladder),
        bandwidthState: ampleBandwidth,
        playerResolution: { width: 3840, height: 2160 },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('1080p');

      reactor.destroy();
    });

    it('re-picks when the player is resized', async () => {
      const state = makeState({
        presentation: createPresentation(ladder),
        bandwidthState: ampleBandwidth,
        playerResolution: { width: 1920, height: 1080 },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('1080p');

      state.playerResolution.set({ width: 640, height: 360 });
      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('360p');

      state.playerResolution.set({ width: 1920, height: 1080 });
      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('1080p');

      reactor.destroy();
    });

    it('does not override a manual selection above the cap', async () => {
      // The cap governs automatic selection only, matching hls.js's
      // capLevelToPlayerSize. `filterByUserSelection` narrows to one track and
      // the chain early-bails before the cap runs.
      const state = makeState({
        presentation: createPresentation(ladder),
        bandwidthState: ampleBandwidth,
        playerResolution: { width: 160, height: 90 },
        userVideoTrackSelection: { width: 1920, height: 1080, bandwidth: 4_800_000 },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('1080p');

      reactor.destroy();
    });

    it('leaves the bandwidth ranker to choose within the capped set', async () => {
      // Cap admits 360p + 720p; the throughput estimate only fits 360p.
      const state = makeState({
        presentation: createPresentation(ladder),
        bandwidthState: createBandwidthState(800_000),
        playerResolution: { width: 1280, height: 720 },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('360p');

      reactor.destroy();
    });

    it('keeps renditions that declare no resolution', async () => {
      // RESOLUTION is optional in HLS. An unmeasurable rendition can't be
      // judged against the player, so the cap must not drop it — here it is the
      // highest-bitrate survivor and wins the rank.
      const withUnsized = [sized('360p', 600_000, 640, 360), createVideoTrack('no-resolution', 900_000)];
      const state = makeState({
        presentation: createPresentation(withUnsized),
        bandwidthState: ampleBandwidth,
        playerResolution: { width: 160, height: 90 },
      });

      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('no-resolution');

      reactor.destroy();
    });
  });

  describe('configuration', () => {
    it.each([
      [4_600_000, 'mid'],
      [4_800_000, 'high'],
    ] as const)('applies default safety margin at %i bps, selecting %s', async (bandwidth, expected) => {
      const ladder = [createVideoTrack('mid', 2_000_000), createVideoTrack('high', 4_000_000)];
      const state = makeState({
        presentation: createPresentation(ladder),
        bandwidthState: { ...createBandwidthState(bandwidth), fastTotalWeight: 1000, slowTotalWeight: 1000 },
      });
      const reactor = switchVideoTrack.setup({ state });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe(expected);
      reactor.destroy();
    });

    it('includes the exact bandwidth threshold and excludes a rendition just above it', async () => {
      const ladder = [
        createVideoTrack('low', 500_000),
        createVideoTrack('mid', 2_000_000),
        createVideoTrack('high', 4_000_000),
      ];

      for (const [bandwidth, expected] of [
        [2_000_000, 'mid'],
        [1_999_999, 'low'],
      ] as const) {
        const state = makeState({
          presentation: createPresentation(ladder),
          // Mature weights make zero-factor correction exactly 1 at this boundary.
          bandwidthState: { ...createBandwidthState(bandwidth), fastTotalWeight: 1000, slowTotalWeight: 1000 },
        });
        const reactor = switchVideoTrack.setup({ state, config: { quality: { safetyMargin: 1 } } });

        await flush();
        expect(state.selectedVideoTrackId.get()).toBe(expected);
        reactor.destroy();
      }
    });

    it('uses custom safetyMargin', async () => {
      const ladder = [createVideoTrack('mid', 2_000_000), createVideoTrack('high', 4_000_000)];

      for (const [config, expected] of [
        [{}, 'mid'],
        [{ quality: { safetyMargin: 0.9 } }, 'high'],
      ] as const) {
        const state = makeState({
          presentation: createPresentation(ladder),
          bandwidthState: createBandwidthState(4_500_000),
        });
        const reactor = switchVideoTrack.setup({ state, config });

        await flush();
        expect(state.selectedVideoTrackId.get()).toBe(expected);
        reactor.destroy();
      }
    });

    it('uses custom upgradeMargin', async () => {
      const closeTracks = [createVideoTrack('low', 1_000_000), createVideoTrack('high', 1_100_000)];
      const state = makeState({
        presentation: createPresentation(closeTracks),
        bandwidthState: createBandwidthState(1_500_000),
        selectedVideoTrackId: 'low',
      });

      const config: SwitchVideoTrackConfig = { quality: { upgradeMargin: 1.05 } };
      const reactor = switchVideoTrack.setup({ state, config });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('high');

      reactor.destroy();
    });

    it('uses initialBandwidth when estimate is not yet reliable', async () => {
      const unreliableState: BandwidthState = {
        fastEstimate: 0,
        fastTotalWeight: 0,
        slowEstimate: 0,
        slowTotalWeight: 0,
        bytesSampled: 0,
      };

      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: unreliableState,
        selectedVideoTrackId: '360p',
      });

      const config: SwitchVideoTrackConfig = { initialBandwidth: 1_000_000 };
      const reactor = switchVideoTrack.setup({ state, config });

      await flush();
      expect(state.selectedVideoTrackId.get()).toBe('360p');
      reactor.destroy();
    });

    it('uses custom minTotalBytes threshold to trust the measured estimate sooner', async () => {
      // 800 kbps measured, only 50 KB sampled — below the default 128 KB
      // threshold (would fall back to initialBandwidth) but above our
      // custom 40 KB override.
      const partialState: BandwidthState = {
        fastEstimate: 800_000,
        fastTotalWeight: 10,
        slowEstimate: 800_000,
        slowTotalWeight: 10,
        bytesSampled: 50_000,
      };

      const state = makeState({
        presentation: createPresentation(tracks),
        bandwidthState: partialState,
        selectedVideoTrackId: '720p',
      });

      const config: SwitchVideoTrackConfig = {
        bandwidth: { minTotalBytes: 40_000 },
        initialBandwidth: 5_000_000,
      };
      const reactor = switchVideoTrack.setup({ state, config });

      await flush();
      // With the override the 800 kbps measurement is trusted and drives a
      // downgrade to 360p; at the default threshold the 5 Mbps initial
      // would have kept 720p.
      expect(state.selectedVideoTrackId.get()).toBe('360p');
      reactor.destroy();
    });
  });
});

// ============================================================================
// switchAudioTrack
//
// The audio variant shares `setupTrackSwitching` with `switchVideoTrack` —
// these tests cover audio slot cleanup, language-filter wiring, and filter
// reactivity. Shared bandwidth ranking and early-bail are covered above.
// ============================================================================

interface SwitchAudioTrackState {
  presentation?: MaybeResolvedPresentation;
  bandwidthState?: BandwidthState;
  selectedAudioTrackId?: string;
  userAudioTrackSelection?: Partial<AudioTrack>;
}

function makeAudioState(initial: SwitchAudioTrackState = {}): StateSignals<SwitchAudioTrackState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    bandwidthState: signal<BandwidthState | undefined>(initial.bandwidthState),
    selectedAudioTrackId: signal<string | undefined>(initial.selectedAudioTrackId),
    userAudioTrackSelection: signal<Partial<AudioTrack> | undefined>(initial.userAudioTrackSelection),
  };
}

function createAudioPresentation(tracks: AudioTrack[]): Presentation {
  return {
    id: 'pres-1',
    url: 'http://example.com/playlist.m3u8',
    selectionSets: [
      {
        id: 'audio-set',
        type: 'audio' as const,
        switchingSets: [
          {
            id: 'audio-switching',
            type: 'audio' as const,
            tracks,
          },
        ],
      } as AudioSelectionSet,
    ],
    startTime: 0,
  };
}

function makeAudioTrack(id: string, overrides: Partial<AudioTrack> = {}): AudioTrack {
  return {
    type: 'audio',
    id,
    url: `http://example.com/${id}.m3u8`,
    bandwidth: 128_000,
    mimeType: 'audio/mp4',
    codecs: ['mp4a.40.2'],
    groupId: 'audio',
    name: id,
    sampleRate: 48000,
    channels: 2,
    startTime: 0,
    duration: 10,
    initialization: { url: `http://example.com/${id}-init.mp4` },
    segments: [],
    ...overrides,
  };
}

describe('switchAudioTrack', () => {
  it.each([
    { preferredAudioLanguage: 'es', defaultLanguage: 'en', userLanguage: undefined, expectedLanguage: 'es' },
    { preferredAudioLanguage: 'fr', defaultLanguage: 'es', userLanguage: undefined, expectedLanguage: 'es' },
    { preferredAudioLanguage: undefined, defaultLanguage: 'es', userLanguage: undefined, expectedLanguage: 'es' },
    { preferredAudioLanguage: 'es', defaultLanguage: 'es', userLanguage: 'en', expectedLanguage: 'en' },
  ])(
    'selects $expectedLanguage with preferredAudioLanguage=$preferredAudioLanguage, default=$defaultLanguage, user=$userLanguage',
    async ({ preferredAudioLanguage, defaultLanguage, userLanguage, expectedLanguage }) => {
      const state = makeAudioState({
        presentation: createAudioPresentation(
          ['en', 'es'].map((language) =>
            makeAudioTrack(`audio-${language}`, { language, default: language === defaultLanguage })
          )
        ),
        userAudioTrackSelection: userLanguage ? { language: userLanguage } : undefined,
      });
      const config = { preferredAudioLanguage, canPlayTrack: () => true };
      const reactor = switchAudioTrack.setup({ state, config });

      try {
        await flush();

        expect(state.selectedAudioTrackId.get()).toBe(`audio-${expectedLanguage}`);
      } finally {
        reactor.destroy();
      }
    }
  );

  it('clears selectedAudioTrackId on src unload', async () => {
    const state = makeAudioState({
      presentation: createAudioPresentation([makeAudioTrack('audio-en', { language: 'en' })]),
    });

    const reactor = switchAudioTrack.setup({ state });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.selectedAudioTrackId.get()).toBe('audio-en');

    state.presentation.set(undefined);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.selectedAudioTrackId.get()).toBeUndefined();

    reactor.destroy();
  });
});

describe('switchAudioTrack — userAudioTrackSelection filter', () => {
  it('narrows candidates by filter (language)', async () => {
    const state = makeAudioState({
      presentation: createAudioPresentation([
        makeAudioTrack('audio-en', { language: 'en' }),
        makeAudioTrack('audio-es', { language: 'es' }),
      ]),
      userAudioTrackSelection: { language: 'es' },
    });

    const reactor = switchAudioTrack.setup({ state });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedAudioTrackId.get()).toBe('audio-es');

    reactor.destroy();
  });

  it('re-picks on filter change mid-presentation', async () => {
    const state = makeAudioState({
      presentation: createAudioPresentation([
        makeAudioTrack('audio-en', { language: 'en' }),
        makeAudioTrack('audio-es', { language: 'es' }),
      ]),
    });

    const reactor = switchAudioTrack.setup({ state });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.selectedAudioTrackId.get()).toBe('audio-en');

    state.userAudioTrackSelection.set({ language: 'es' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.selectedAudioTrackId.get()).toBe('audio-es');

    reactor.destroy();
  });
});

// ============================================================================
// preferActiveCdn — active-CDN scope (shared by video + audio)
// ============================================================================

describe('preferActiveCdn (active-CDN scope)', () => {
  const cdnVideoTrack = (id: string, host: string, bandwidth: number): PartiallyResolvedVideoTrack => ({
    type: 'video',
    codecs: [],
    id,
    url: `https://${host}/${id}.m3u8`,
    bandwidth,
    mimeType: 'video/mp4',
  });

  // Two renditions duplicated across cdn-a (listed first) and cdn-b.
  const multiCdn = () =>
    createPresentation([
      cdnVideoTrack('720p-a', 'cdn-a.example.com', 2_400_000),
      cdnVideoTrack('720p-b', 'cdn-b.example.com', 2_400_000),
      cdnVideoTrack('1080p-a', 'cdn-a.example.com', 4_800_000),
      cdnVideoTrack('1080p-b', 'cdn-b.example.com', 4_800_000),
    ]);

  const asymmetricCdn = () =>
    createPresentation([
      cdnVideoTrack('720p-a', 'cdn-a.example.com', 2_400_000),
      cdnVideoTrack('1080p-a', 'cdn-a.example.com', 4_800_000),
      cdnVideoTrack('720p-b', 'cdn-b.example.com', 2_400_000),
      cdnVideoTrack('1080p-b', 'cdn-b.example.com', 4_800_000),
      cdnVideoTrack('1440p-b', 'cdn-b.example.com', 6_000_000),
    ]);

  // Bandwidth high enough that 1080p fits, so the pick is the highest rendition
  // on whichever CDN the scope leaves standing.
  const makeCdnState = (cdnPriority?: string[]) => ({
    presentation: signal<MaybeResolvedPresentation | undefined>(multiCdn()),
    bandwidthState: signal<BandwidthState | undefined>(createBandwidthState(10_000_000)),
    selectedVideoTrackId: signal<string | undefined>(undefined),
    userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(undefined),
    cdnPriority: signal<string[] | undefined>(cdnPriority),
  });

  it('narrows the pick to the highest-priority CDN, overriding manifest track order', async () => {
    // cdn-a's 1080p is listed first in the tracks, but cdn-b is first in `cdnPriority`,
    // so the scope picks cdn-b. (Without the scope abr would pick 1080p-a.)
    const state = makeCdnState(['https://cdn-b.example.com', 'https://cdn-a.example.com']);
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-b');
    reactor.destroy();
  });

  it('falls through to the next CDN when the first has no surviving tracks', async () => {
    // Z has no tracks; B is the next priority despite A's manifest-order lead.
    const state = makeCdnState(['https://cdn-z.example.com', 'https://cdn-b.example.com', 'https://cdn-a.example.com']);
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-b');
    reactor.destroy();
  });

  it('falls through to all CDNs when no list entry matches any track', async () => {
    const state = makeCdnState(['https://cdn-z.example.com']);

    state.presentation.set(asymmetricCdn());
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1440p-b');
    reactor.destroy();
  });

  it('is a no-op when no cdnPriority list is present', async () => {
    const state = makeCdnState(undefined);

    state.presentation.set(asymmetricCdn());
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1440p-b');
    reactor.destroy();
  });

  it('applies the scope when cdnPriority arrives after the first pick (composition-order independence)', async () => {
    // Guards against the pick depending on `deriveCdnPriority` being composed
    // *before* `switchVideoTrack`. The worst case — deriveCdnPriority last — is
    // equivalent to cdnPriority being written after switch*'s first pick. The
    // scope subscribes to cdnPriority even while it's undefined, so a late write
    // must re-fire and correct the pick.
    const state = makeCdnState(undefined);
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    // No cdnPriority yet → scope is a no-op → ranker picks the manifest head.
    expect(state.selectedVideoTrackId.get()).toBe('1080p-a');

    state.cdnPriority.set(['https://cdn-b.example.com', 'https://cdn-a.example.com']);
    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-b');

    reactor.destroy();
  });

  it('re-picks when the CDN order changes while staying resolved (steering/failover seam)', async () => {
    const state = makeCdnState(['https://cdn-a.example.com', 'https://cdn-b.example.com']);
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-a');

    state.cdnPriority.set(['https://cdn-b.example.com', 'https://cdn-a.example.com']);
    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-b');

    reactor.destroy();
  });

  it('applies the same scope to the audio chain (cross-type CDN coherence)', async () => {
    const state = {
      presentation: signal<MaybeResolvedPresentation | undefined>(
        createAudioPresentation([
          makeAudioTrack('aud-a', { url: 'https://cdn-a.example.com/aud.m3u8' }),
          makeAudioTrack('aud-b', { url: 'https://cdn-b.example.com/aud.m3u8' }),
        ])
      ),
      bandwidthState: signal<BandwidthState | undefined>(undefined),
      selectedAudioTrackId: signal<string | undefined>(undefined),
      userAudioTrackSelection: signal<Partial<AudioTrack> | undefined>(undefined),
      cdnPriority: signal<string[] | undefined>(['https://cdn-b.example.com', 'https://cdn-a.example.com']),
    };
    const reactor = switchAudioTrack.setup({ state });

    await flush();
    expect(state.selectedAudioTrackId.get()).toBe('aud-b');
    reactor.destroy();
  });
});

// ============================================================================
// excludeFailedCdns — the failover constraint (hard pre-pass) + scope interplay
// ============================================================================

describe('excludeFailedCdns (failover constraint)', () => {
  const cdnVideoTrack = (id: string, host: string, bandwidth: number): PartiallyResolvedVideoTrack => ({
    type: 'video',
    codecs: [],
    id,
    url: `https://${host}/${id}.m3u8`,
    bandwidth,
    mimeType: 'video/mp4',
  });

  const multiCdn = () =>
    createPresentation([
      cdnVideoTrack('720p-a', 'cdn-a.example.com', 2_400_000),
      cdnVideoTrack('720p-b', 'cdn-b.example.com', 2_400_000),
      cdnVideoTrack('1080p-a', 'cdn-a.example.com', 4_800_000),
      cdnVideoTrack('1080p-b', 'cdn-b.example.com', 4_800_000),
    ]);

  const makeState = (failedCdns?: string[]) => ({
    presentation: signal<MaybeResolvedPresentation | undefined>(multiCdn()),
    bandwidthState: signal<BandwidthState | undefined>(createBandwidthState(10_000_000)),
    selectedVideoTrackId: signal<string | undefined>(undefined),
    userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(undefined),
    cdnPriority: signal<string[] | undefined>(['https://cdn-a.example.com', 'https://cdn-b.example.com']),
    failedCdns: signal<string[] | undefined>(failedCdns),
  });

  it('fails over to the next CDN when the primary is in cooldown', async () => {
    const state = makeState(['https://cdn-a.example.com']);
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    // cdn-a's tracks are pruned by the constraint, so the scope falls to cdn-b.
    expect(state.selectedVideoTrackId.get()).toBe('1080p-b');
    reactor.destroy();
  });

  it('fails over reactively, then returns to the primary on recovery', async () => {
    const state = makeState(undefined);
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-a');

    // cdn-a enters cooldown → prune → scope falls to cdn-b.
    state.failedCdns.set(['https://cdn-a.example.com']);
    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-b');

    // cdn-a recovers → its tracks reappear → scope snaps back to the primary.
    state.failedCdns.set([]);
    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-a');

    reactor.destroy();
  });

  it('clears the selection when every CDN is in cooldown, re-picking on recovery', async () => {
    const state = makeState(undefined);
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-a');

    // All CDNs cooled down → constraints prune every track → no playable set →
    // the selection clears (no pick) rather than lingering on an unreachable CDN.
    state.failedCdns.set(['https://cdn-a.example.com', 'https://cdn-b.example.com']);
    await flush();
    expect(state.selectedVideoTrackId.get()).toBeUndefined();

    // A CDN recovers → its tracks reappear → the candidate set refills and re-picks.
    state.failedCdns.set(['https://cdn-b.example.com']);
    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('1080p-a');

    reactor.destroy();
  });
});

// ============================================================================
// excludeUnplayableTracks — the capability constraint (hard pre-pass)
// ============================================================================

describe('excludeUnplayableTracks (capability constraint)', () => {
  const codecVideoTrack = (id: string, codec: string, bandwidth: number): PartiallyResolvedVideoTrack => ({
    type: 'video',
    codecs: [codec],
    id,
    url: `https://example.com/${id}.m3u8`,
    bandwidth,
    mimeType: 'video/mp4',
  });

  // Mixed HEVC + AVC ladder; the same bitrates on each codec.
  const mixedCodecPresentation = () =>
    createPresentation([
      codecVideoTrack('720p-hevc', 'hvc1.1.6.L93.B0', 2_400_000),
      codecVideoTrack('720p-avc', 'avc1.4d401f', 2_400_000),
      codecVideoTrack('1080p-hevc', 'hvc1.1.6.L120.B0', 4_800_000),
      codecVideoTrack('1080p-avc', 'avc1.640028', 4_800_000),
    ]);

  // Rejects HEVC, accepts everything else.
  const rejectsHevc = (track: { codecs?: string[] }) => !track.codecs?.some((c) => c.startsWith('hvc1'));

  const makeState = () => ({
    presentation: signal<MaybeResolvedPresentation | undefined>(mixedCodecPresentation()),
    bandwidthState: signal<BandwidthState | undefined>(createBandwidthState(10_000_000)),
    selectedVideoTrackId: signal<string | undefined>(undefined),
    userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(undefined),
  });

  it('prunes undecodable renditions before ranking — picks the best playable codec', async () => {
    const state = makeState();
    const reactor = switchVideoTrack.setup({ state, config: { canPlayTrack: rejectsHevc, preferredCodecs: [] } });

    await flush();
    // HEVC pruned upstream; ranker picks the highest-bitrate AVC that fits.
    expect(state.selectedVideoTrackId.get()).toBe('1080p-avc');
    reactor.destroy();
  });

  it('passes everything through when no canPlayTrack probe is wired', async () => {
    const state = makeState();
    // preferredCodecs: [] keeps the codec-family preference (its own describe)
    // out of this test's lens on the constraint.
    const reactor = switchVideoTrack.setup({ state, config: { preferredCodecs: [] } });

    await flush();
    // No probe → HEVC survives; same-bitrate tie keeps manifest order, so the
    // first 1080p (HEVC) wins.
    expect(state.selectedVideoTrackId.get()).toBe('1080p-hevc');
    reactor.destroy();
  });

  it('still excludes an unplayable track the user selected (hard constraint beats the soft filter)', async () => {
    const state = makeState();

    state.userVideoTrackSelection.set({ id: '1080p-hevc' });
    const reactor = switchVideoTrack.setup({ state, config: { canPlayTrack: rejectsHevc } });

    await flush();
    // The user's HEVC pick is pruned by the constraint before the user filter
    // runs; the filter finds no match and falls through to the playable set.
    expect(state.selectedVideoTrackId.get()).toBe('1080p-avc');
    reactor.destroy();
  });

  it('clears a prior pick when a later relabel prunes every rendition to empty', async () => {
    const state = makeState();
    // Accepts fMP4; rejects the non-fMP4 container MIME resolve-track relabels to.
    // preferredCodecs: [] keeps the codec-family preference out of the picture.
    const canPlayTrack = (track: { mimeType?: string }) => track.mimeType !== 'video/mp2t';
    const reactor = switchVideoTrack.setup({ state, config: { canPlayTrack, preferredCodecs: [] } });

    await flush();
    // Pick made while the tracks are still labeled video/mp4.
    expect(state.selectedVideoTrackId.get()).toBe('1080p-hevc');

    // resolve-track detects a TS container and relabels the whole video type;
    // every rendition is now undecodable → candidate set empties → the now-stale
    // pick clears (instead of lingering as an unplayable selection that stalls).
    state.presentation.set(applyContainerMimeType(mixedCodecPresentation(), 'video', 'video/mp2t'));
    await flush();
    expect(state.selectedVideoTrackId.get()).toBeUndefined();

    reactor.destroy();
  });
});

// ============================================================================
// Codec-family policy — preferCodecFamilies (initial-pick scope) +
// stickToSelectedCodecs (sticky constraint)
//
// SPF implements no `SourceBuffer.changeType()`, so a mid-stream pick outside
// the initially-selected codec families would append undecodable data into a
// buffer created under the initial family's mimetype. The sticky constraint
// prunes such picks in the pre-pass; the preference scope narrows which
// family the *initial* pick lands in on mixed-codec sources (the Apple bipbop
// advanced example muxes HEVC + AVC renditions of the same content).
// ============================================================================

const codecFamilyTrack = (id: string, bandwidth: number, codecs: string[]): PartiallyResolvedVideoTrack => ({
  ...createVideoTrack(id, bandwidth),
  codecs,
});

// Mixed-codec ladder (bipbop shape). At most bandwidths the best-fitting rung
// is HEVC, so a pick that lands on AVC is the preference's doing, not ABR's.
const mixedFamilyLadder = () => [
  codecFamilyTrack('avc-low', 1_000_000, ['avc1.640020']),
  codecFamilyTrack('avc-high', 3_000_000, ['avc1.640028']),
  codecFamilyTrack('hvc-low', 900_000, ['hvc1.2.4.L123.B0']),
  codecFamilyTrack('hvc-high', 3_200_000, ['hvc1.2.4.L150.B0']),
  codecFamilyTrack('hvc-4k', 8_000_000, ['hvc1.2.4.L153.B0']),
];

describe('preferCodecFamilies (codec-family scope)', () => {
  it('narrows the initial pick to the default AVC/AAC families on a mixed-codec ladder', async () => {
    const state = makeState({
      presentation: createPresentation(mixedFamilyLadder()),
      bandwidthState: createBandwidthState(4_000_000),
    });
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    // The best fitting rung overall is hvc-high (3.2M under the 3.4M
    // threshold); the default preference narrows to AVC first, so the best
    // fitting AVC rung wins.
    expect(state.selectedVideoTrackId.get()).toBe('avc-high');
    reactor.destroy();
  });

  it('disables the preference for preferredCodecs: []', async () => {
    const state = makeState({
      presentation: createPresentation(mixedFamilyLadder()),
      bandwidthState: createBandwidthState(4_000_000),
    });
    const reactor = switchVideoTrack.setup({ state, config: { preferredCodecs: [] } });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('hvc-high');
    reactor.destroy();
  });

  it('honors a configured non-default family', async () => {
    const state = makeState({
      presentation: createPresentation(mixedFamilyLadder()),
      bandwidthState: createBandwidthState(4_000_000),
    });
    const reactor = switchVideoTrack.setup({ state, config: { preferredCodecs: ['hvc1'] } });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('hvc-high');
    reactor.destroy();
  });

  it('falls through on a ladder with no preferred-family rendition', async () => {
    const state = makeState({
      presentation: createPresentation([
        codecFamilyTrack('hvc-low', 900_000, ['hvc1.2.4.L123.B0']),
        codecFamilyTrack('hvc-high', 3_200_000, ['hvc1.2.4.L150.B0']),
      ]),
      bandwidthState: createBandwidthState(4_000_000),
    });
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    // Nothing matches AVC/AAC → the soft filter is skipped, not applied to
    // empty — an HEVC-only source plays exactly as before.
    expect(state.selectedVideoTrackId.get()).toBe('hvc-high');
    reactor.destroy();
  });

  it('narrows the audio initial pick to AAC over a higher-bitrate E-AC-3', async () => {
    const state = makeAudioState({
      presentation: createAudioPresentation([
        makeAudioTrack('audio-ec3', { codecs: ['ec-3'], bandwidth: 640_000 }),
        makeAudioTrack('audio-aac', { codecs: ['mp4a.40.2'], bandwidth: 128_000 }),
      ]),
    });
    const reactor = switchAudioTrack.setup({ state });

    await flush();
    // Without the preference the ranker takes E-AC-3 (highest fitting bitrate,
    // listed first); mp4a is in the default preferred families, ec-3 is not.
    expect(state.selectedAudioTrackId.get()).toBe('audio-aac');
    reactor.destroy();
  });
});

describe('stickToSelectedCodecs (codec-family sticky constraint)', () => {
  it('keeps re-picks within the selected codec family (upgrades stay in-family)', async () => {
    // preferredCodecs: [] isolates the sticky scope from the preference.
    const state = makeState({
      presentation: createPresentation(mixedFamilyLadder()),
      bandwidthState: createBandwidthState(12_000_000),
      selectedVideoTrackId: 'avc-low',
    });
    const reactor = switchVideoTrack.setup({ state, config: { preferredCodecs: [] } });

    await flush();
    // Everything fits at 12M and the best rung overall is hvc-4k, but the
    // pick sticks to the AVC family — upgrading within it.
    expect(state.selectedVideoTrackId.get()).toBe('avc-high');
    reactor.destroy();
  });

  it('ignores a cross-family user selection mid-stream, honors an in-family one', async () => {
    const state = makeState({
      presentation: createPresentation(mixedFamilyLadder()),
      bandwidthState: createBandwidthState(12_000_000),
      selectedVideoTrackId: 'avc-high',
    });
    const reactor = switchVideoTrack.setup({ state, config: { preferredCodecs: [] } });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('avc-high');

    state.userVideoTrackSelection.set({ id: 'hvc-4k' });
    await flush();
    // The constraint prunes the HEVC pick in the pre-pass, so the user filter
    // never sees it and falls through.
    expect(state.selectedVideoTrackId.get()).toBe('avc-high');

    state.userVideoTrackSelection.set({ id: 'avc-low' });
    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('avc-low');
    reactor.destroy();
  });

  it("locks to the family the user's initial pick landed in", async () => {
    const state = makeState({
      presentation: createPresentation(mixedFamilyLadder()),
      bandwidthState: createBandwidthState(12_000_000),
      userVideoTrackSelection: { id: 'hvc-4k' },
    });
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    // No selection yet → the sticky scope passes through, and the user's
    // explicit pick may land in any family (the default preference sits
    // behind the user filter).
    expect(state.selectedVideoTrackId.get()).toBe('hvc-4k');

    state.userVideoTrackSelection.set(undefined);
    await flush();
    // Intent withdrawn: re-picks stay in the HEVC family the initial pick
    // landed in (the AVC-preferring default falls through inside it).
    expect(state.selectedVideoTrackId.get()).toBe('hvc-4k');
    reactor.destroy();
  });

  it('matches the full codec-family set — a shared audio codec is not enough', async () => {
    const muxed = [
      codecFamilyTrack('muxed-avc', 1_000_000, ['avc1.640020', 'mp4a.40.2']),
      codecFamilyTrack('muxed-hvc', 3_000_000, ['hvc1.2.4.L150.B0', 'mp4a.40.2']),
    ];
    const state = makeState({
      presentation: createPresentation(muxed),
      bandwidthState: createBandwidthState(12_000_000),
      selectedVideoTrackId: 'muxed-avc',
    });
    const reactor = switchVideoTrack.setup({ state, config: { preferredCodecs: [] } });

    await flush();
    // {hvc1, mp4a} shares mp4a with {avc1, mp4a} but isn't the same family
    // set; the buffer's mimetype still can't take it.
    expect(state.selectedVideoTrackId.get()).toBe('muxed-avc');
    reactor.destroy();
  });

  it('keeps an audio pick in-family when the requested language only exists in another family', async () => {
    const state = makeAudioState({
      presentation: createAudioPresentation([
        makeAudioTrack('audio-aac-en', { language: 'en' }),
        makeAudioTrack('audio-ec3-es', { language: 'es', codecs: ['ec-3'], bandwidth: 640_000 }),
      ]),
      selectedAudioTrackId: 'audio-aac-en',
    });
    const reactor = switchAudioTrack.setup({ state });

    await flush();
    expect(state.selectedAudioTrackId.get()).toBe('audio-aac-en');

    state.userAudioTrackSelection.set({ language: 'es' });
    await flush();
    // Spanish exists only as E-AC-3; honoring it would cross codec families,
    // so the constraint prunes it and the pick stands.
    expect(state.selectedAudioTrackId.get()).toBe('audio-aac-en');
    reactor.destroy();
  });

  it('reports and clears when the selected family vanishes, re-picking on recovery', async () => {
    // AVC only on cdn-a, HEVC only on cdn-b: the shape where failover can
    // remove a whole codec family from the playable set.
    const cdnFamilyTrack = (id: string, host: string, bandwidth: number, codecs: string[]) => ({
      ...createVideoTrack(id, bandwidth),
      url: `https://${host}/${id}.m3u8`,
      codecs,
    });
    const state = {
      presentation: signal<MaybeResolvedPresentation | undefined>(
        createPresentation([
          cdnFamilyTrack('avc-low', 'cdn-a.example.com', 1_000_000, ['avc1.640020']),
          cdnFamilyTrack('avc-high', 'cdn-a.example.com', 3_000_000, ['avc1.640028']),
          cdnFamilyTrack('hvc-low', 'cdn-b.example.com', 900_000, ['hvc1.2.4.L123.B0']),
          cdnFamilyTrack('hvc-high', 'cdn-b.example.com', 3_200_000, ['hvc1.2.4.L150.B0']),
        ])
      ),
      bandwidthState: signal<BandwidthState | undefined>(createBandwidthState(4_000_000)),
      selectedVideoTrackId: signal<string | undefined>(undefined),
      userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(undefined),
      failedCdns: signal<string[] | undefined>(undefined),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const reactor = switchVideoTrack.setup({ state });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('avc-high');

    // The only CDN carrying the selected family enters cooldown: the failover
    // constraint leaves HEVC, this constraint removes it — an explicable
    // reported stop instead of an opaque decode error at append.
    state.failedCdns.set(['https://cdn-a.example.com']);
    await flush();
    expect(state.selectedVideoTrackId.get()).toBeUndefined();
    expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_NO_SUPPORTED_VIDEO_TRACK]);

    // Cooldown ends: the family is playable again and selection recovers.
    state.failedCdns.set(undefined);
    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('avc-high');
    reactor.destroy();
  });
});

// ============================================================================
// no-supported-track error emission (SVTA 2011 / 2012)
// ============================================================================

describe('switchVideoTrack', () => {
  const codecVideoTrack = (id: string, codec: string): PartiallyResolvedVideoTrack => ({
    type: 'video',
    codecs: [codec],
    id,
    url: `https://cdn-a.example.com/${id}.m3u8`,
    bandwidth: 2_400_000,
    mimeType: 'video/mp4',
  });

  const makeState = (failedCdns?: string[]) => ({
    presentation: signal<MaybeResolvedPresentation | undefined>(
      createPresentation([codecVideoTrack('720p', 'avc1.4d401f'), codecVideoTrack('1080p', 'avc1.640028')])
    ),
    bandwidthState: signal<BandwidthState | undefined>(createBandwidthState(10_000_000)),
    selectedVideoTrackId: signal<string | undefined>(undefined),
    userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(undefined),
    failedCdns: signal<string[] | undefined>(failedCdns),
    errors: signal<SvtaError[] | undefined>(undefined),
  });

  it('emits SVTA 2011 when capability prunes every video rendition', async () => {
    const state = makeState();
    const reactor = switchVideoTrack.setup({ state, config: { canPlayTrack: () => false } });

    await flush();

    expect(state.selectedVideoTrackId.get()).toBeUndefined();
    expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_NO_SUPPORTED_VIDEO_TRACK]);
    reactor.destroy();
  });

  it('emits regardless of which constraint emptied the set', async () => {
    // Every CDN in cooldown empties the set just as capability rejection does.
    // The behavior reports generically rather than reading any constraint's
    // state: a type with renditions but none selectable can't play, and every
    // CDN having failed is not a benign condition either.
    const state = makeState(['https://cdn-a.example.com']);
    const reactor = switchVideoTrack.setup({ state });

    await flush();

    expect(state.selectedVideoTrackId.get()).toBeUndefined();
    expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_NO_SUPPORTED_VIDEO_TRACK]);

    reactor.destroy();
  });

  it('emits nothing for a type that simply has no tracks', async () => {
    const state = {
      presentation: signal<MaybeResolvedPresentation | undefined>(createPresentation([])),
      bandwidthState: signal<BandwidthState | undefined>(createBandwidthState(10_000_000)),
      selectedVideoTrackId: signal<string | undefined>(undefined),
      userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(undefined),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const reactor = switchVideoTrack.setup({ state });

    await flush();

    // A video-less source is legitimate, not an error.
    expect(state.errors.get()).toBeUndefined();
    reactor.destroy();
  });
});

describe('switchAudioTrack', () => {
  it('emits SVTA 2012 for the audio variant', async () => {
    const state = {
      presentation: signal<MaybeResolvedPresentation | undefined>(
        createAudioPresentation([makeAudioTrack('aud-en', { url: 'https://cdn-a.example.com/aud.m3u8' })])
      ),
      bandwidthState: signal<BandwidthState | undefined>(undefined),
      selectedAudioTrackId: signal<string | undefined>(undefined),
      userAudioTrackSelection: signal<Partial<AudioTrack> | undefined>(undefined),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const reactor = switchAudioTrack.setup({ state, config: { canPlayTrack: () => false } });

    await flush();

    expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_NO_SUPPORTED_AUDIO_TRACK]);
    reactor.destroy();
  });
});

describe('switchTextTrack', () => {
  it('emits nothing for the text variant — absent subtitles are not an error', async () => {
    const subtitle: PartiallyResolvedTextTrack = {
      type: 'text',
      id: 'sub-en',
      url: 'https://cdn-a.example.com/sub-en.m3u8',
      bandwidth: 256,
      mimeType: 'application/mp4',
      groupId: 'text',
      label: 'en',
      kind: 'subtitles',
      language: 'en',
    };
    const state = {
      presentation: signal<MaybeResolvedPresentation | undefined>({
        id: 'presentation-text',
        url: 'https://example.com/playlist.m3u8',
        selectionSets: [
          {
            id: 'text-set',
            type: 'text' as const,
            switchingSets: [{ id: 'text-switching', type: 'text' as const, tracks: [subtitle] }],
          } as TextSelectionSet,
        ],
      } as Presentation),
      selectedTextTrackId: signal<string | undefined>(undefined),
      userTextTrackSelection: signal<Partial<TextTrack> | 'off' | undefined>(undefined),
      failedCdns: signal<string[] | undefined>(['https://cdn-a.example.com']),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const reactor = switchTextTrack.setup({ state });

    await flush();

    // The text variant configures no code: an unavailable subtitle track is not
    // a playback failure, so nothing is reported even though the set is empty.
    expect(state.errors.get()).toBeUndefined();

    reactor.destroy();
  });
});

describe('excludeRefusedKeySystems (refused-key-system constraint)', () => {
  const drmVideoTrack = (id: string, encrypted: boolean): PartiallyResolvedVideoTrack =>
    ({
      type: 'video',
      codecs: ['avc1.4d401f'],
      id,
      url: `https://example.com/${id}.m3u8`,
      bandwidth: 2_400_000,
      mimeType: 'video/mp4',
      metadata: {
        [MEDIA_PLAYLIST_METADATA_KEY]: { targetDuration: 4, mediaSequence: 0, endList: true, encrypted },
      },
    }) as PartiallyResolvedVideoTrack;

  const makeState = (tracks: PartiallyResolvedVideoTrack[], negotiatedKeySystem?: string) => ({
    presentation: signal<MaybeResolvedPresentation | undefined>(createPresentation(tracks)),
    bandwidthState: signal<BandwidthState | undefined>(createBandwidthState(10_000_000)),
    selectedVideoTrackId: signal<string | undefined>(undefined),
    userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(undefined),
    negotiatedKeySystem: signal<string | undefined>(negotiatedKeySystem),
    errors: signal<SvtaError[] | undefined>(undefined),
  });
  // The engine's shape: the default pre-pass extended, not replaced.
  const config = { videoConstraints: [...DEFAULT_VIDEO_CONSTRAINTS, excludeRefusedKeySystems] };

  it('leaves encrypted renditions alone while negotiation has not settled', async () => {
    // `undefined` is "not yet", not "refused" — pruning here would park a source
    // that is about to license perfectly well.
    const state = makeState([drmVideoTrack('720p', true)]);
    const reactor = switchVideoTrack.setup({ state, config });

    await flush();

    expect(state.selectedVideoTrackId.get()).toBe('720p');
    expect(state.errors.get()).toBeUndefined();
    reactor.destroy();
  });

  it('prunes encrypted renditions once negotiation publishes a refusal, and the emptied type reports its own verdict', async () => {
    const state = makeState([drmVideoTrack('720p', true)], NO_KEY_SYSTEM);
    const reactor = switchVideoTrack.setup({ state, config });

    await flush();

    // The verdict comes from `track-switching`, not from `setupMediaKeys` —
    // which reports only the 4008 cause.
    expect(state.selectedVideoTrackId.get()).toBeUndefined();
    expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_NO_SUPPORTED_VIDEO_TRACK]);
    reactor.destroy();
  });

  it('spares a type keeping a clear rendition, and reports no verdict', async () => {
    // Mux's shape: encrypted and clear renditions side by side. The clear one
    // still plays, so a verdict would be wrong.
    const state = makeState([drmVideoTrack('720p-enc', true), drmVideoTrack('720p-clear', false)], NO_KEY_SYSTEM);
    const reactor = switchVideoTrack.setup({ state, config });

    await flush();

    expect(state.selectedVideoTrackId.get()).toBe('720p-clear');
    expect(state.errors.get()).toBeUndefined();
    reactor.destroy();
  });

  it('re-prunes when the refusal arrives after the first pick', async () => {
    // Negotiation is async, so the encrypted rendition is picked first and the
    // refusal lands later; the chain re-derives on the slot write.
    const state = makeState([drmVideoTrack('720p', true)]);
    const reactor = switchVideoTrack.setup({ state, config });

    await flush();
    expect(state.selectedVideoTrackId.get()).toBe('720p');

    state.negotiatedKeySystem.set(NO_KEY_SYSTEM);
    await flush();

    expect(state.selectedVideoTrackId.get()).toBeUndefined();
    expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_NO_SUPPORTED_VIDEO_TRACK]);
    reactor.destroy();
  });

  it('is inert for a composition that never carries the slot', async () => {
    const state = {
      presentation: signal<MaybeResolvedPresentation | undefined>(createPresentation([drmVideoTrack('720p', true)])),
      bandwidthState: signal<BandwidthState | undefined>(createBandwidthState(10_000_000)),
      selectedVideoTrackId: signal<string | undefined>(undefined),
      userVideoTrackSelection: signal<Partial<VideoTrack> | undefined>(undefined),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const reactor = switchVideoTrack.setup({ state, config });

    await flush();

    expect(state.selectedVideoTrackId.get()).toBe('720p');
    reactor.destroy();
  });
});

// ============================================================================
// switchTextTrack — intent-resolved, optional selection
// ============================================================================

describe('switchTextTrack', () => {
  const textTrack = (
    id: string,
    opts: { language?: string; default?: boolean; forced?: boolean; host?: string } = {}
  ): PartiallyResolvedTextTrack => ({
    type: 'text',
    id,
    url: `https://${opts.host ?? 'cdn-a.example.com'}/${id}.m3u8`,
    bandwidth: 256,
    mimeType: 'application/mp4',
    groupId: 'text',
    label: id,
    kind: 'subtitles',
    language: opts.language,
    default: opts.default,
    forced: opts.forced,
  });

  const textPresentation = (textTracks: PartiallyResolvedTextTrack[]): Presentation =>
    ({
      id: 'presentation-text',
      url: 'https://example.com/playlist.m3u8',
      selectionSets: [
        {
          id: 'text-set',
          type: 'text' as const,
          switchingSets: [{ id: 'text-switching', type: 'text' as const, tracks: textTracks }],
        } as TextSelectionSet,
      ],
    }) as Presentation;

  interface TextState {
    presentation?: MaybeResolvedPresentation;
    selectedTextTrackId?: string;
    userTextTrackSelection?: Partial<TextTrack> | 'off';
    cdnPriority?: string[];
    failedCdns?: string[];
  }

  const makeTextState = (initial: Partial<TextState> = {}): StateSignals<TextState> => ({
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    selectedTextTrackId: signal<string | undefined>(initial.selectedTextTrackId),
    userTextTrackSelection: signal<Partial<TextTrack> | 'off' | undefined>(initial.userTextTrackSelection),
    cdnPriority: signal<string[] | undefined>(initial.cdnPriority),
    failedCdns: signal<string[] | undefined>(initial.failedCdns),
  });

  const enEs = () => [textTrack('en', { language: 'en' }), textTrack('es', { language: 'es' })];

  describe('default policy (auto — no user intent)', () => {
    it('does not auto-select when no preference matches (opt-in)', async () => {
      const state = makeTextState({ presentation: textPresentation(enEs()) });
      const reactor = switchTextTrack.setup({ state });

      await flush();
      expect(state.selectedTextTrackId.get()).toBeUndefined();
      reactor.destroy();
    });

    it('auto-selects the preferredSubtitleLanguage match', async () => {
      const state = makeTextState({ presentation: textPresentation(enEs()) });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'es' } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBe('es');
      reactor.destroy();
    });

    it('auto-selects the DEFAULT track when enableDefaultTrack and no preference', async () => {
      const state = makeTextState({
        presentation: textPresentation([
          textTrack('en', { language: 'en' }),
          textTrack('es', { language: 'es', default: true }),
        ]),
      });
      const reactor = switchTextTrack.setup({ state, config: { enableDefaultTrack: true } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBe('es');
      reactor.destroy();
    });

    it('excludes FORCED tracks from auto-selection by default', async () => {
      const state = makeTextState({
        presentation: textPresentation([textTrack('es-forced', { language: 'es', forced: true })]),
      });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'es' } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBeUndefined();
      reactor.destroy();
    });

    it('includes FORCED tracks when includeForcedTracks is set', async () => {
      const state = makeTextState({
        presentation: textPresentation([textTrack('es-forced', { language: 'es', forced: true })]),
      });
      const reactor = switchTextTrack.setup({
        state,
        config: { preferredSubtitleLanguage: 'es', includeForcedTracks: true },
      });

      await flush();
      expect(state.selectedTextTrackId.get()).toBe('es-forced');
      reactor.destroy();
    });

    it('clears the selection on src unload', async () => {
      const state = makeTextState({ presentation: textPresentation(enEs()) });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'es' } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBe('es');
      state.presentation.set(undefined);
      await flush();
      expect(state.selectedTextTrackId.get()).toBeUndefined();
      reactor.destroy();
    });
  });

  describe('user intent', () => {
    it('honors an explicit user selection over the default policy', async () => {
      const state = makeTextState({
        presentation: textPresentation(enEs()),
        userTextTrackSelection: { language: 'es' },
      });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'en' } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBe('es');
      reactor.destroy();
    });

    it("resolves explicit 'off' to no selection, even when a default would match", async () => {
      const state = makeTextState({
        presentation: textPresentation([textTrack('en', { language: 'en' })]),
        userTextTrackSelection: 'off',
        selectedTextTrackId: 'en',
      });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'en' } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBeUndefined();
      reactor.destroy();
    });

    it("keeps 'off' sticky across a candidate-set change (live refresh)", async () => {
      const state = makeTextState({
        presentation: textPresentation([textTrack('en', { language: 'en' })]),
        userTextTrackSelection: 'off',
      });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'en' } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBeUndefined();

      // New resolved presentation (stays resolved) — re-runs the chain; 'off' holds.
      state.presentation.set({ ...textPresentation(enEs()), id: 'pres-2' });
      await flush();
      expect(state.selectedTextTrackId.get()).toBeUndefined();
      reactor.destroy();
    });

    it('falls through to the default policy when an explicit pick is stale (language gone)', async () => {
      const state = makeTextState({
        presentation: textPresentation([textTrack('en', { language: 'en' })]),
        userTextTrackSelection: { language: 'es' },
      });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'en' } });

      await flush();
      // No 'es' candidate → explicit match empty → default policy picks 'en'.
      expect(state.selectedTextTrackId.get()).toBe('en');
      reactor.destroy();
    });
  });

  describe('CDN constraints + scope', () => {
    const esBothCdns = () => [
      textTrack('es-a', { language: 'es', host: 'cdn-a.example.com' }),
      textTrack('es-b', { language: 'es', host: 'cdn-b.example.com' }),
    ];

    it('co-locates captions on the active CDN (cdnPriority)', async () => {
      const state = makeTextState({
        presentation: textPresentation(esBothCdns()),
        cdnPriority: ['https://cdn-b.example.com', 'https://cdn-a.example.com'],
      });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'es' } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBe('es-b');
      reactor.destroy();
    });

    it('re-resolves to the surviving CDN when the active CDN fails', async () => {
      const state = makeTextState({
        presentation: textPresentation(esBothCdns()),
        cdnPriority: ['https://cdn-a.example.com', 'https://cdn-b.example.com'],
      });
      const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'es' } });

      await flush();
      expect(state.selectedTextTrackId.get()).toBe('es-a');

      state.failedCdns.set(['https://cdn-a.example.com']);
      await flush();
      expect(state.selectedTextTrackId.get()).toBe('es-b');
      reactor.destroy();
    });
  });
});

// ============================================================================
// Per-type chain config — each variant's constraints and rules are config, with
// the status-quo chain as the default. Keyed per type because one engine config
// reaches every variant.
// ============================================================================

describe('per-type chain config', () => {
  const tracks = () => [createVideoTrack('360p', 1_000_000), createVideoTrack('1080p', 2_000_000)];
  const pruneAll: SwitchVideoTrackRule = () => [];
  const lowestBandwidth: SwitchVideoTrackRule = (candidates) =>
    [...candidates].sort((a, b) => (a.bandwidth ?? 0) - (b.bandwidth ?? 0));

  it('replaces the video rule chain with videoRules', async () => {
    const state = makeState({
      presentation: createPresentation(tracks()),
      bandwidthState: createBandwidthState(10_000_000),
    });
    const reactor = switchVideoTrack.setup({ state, config: { videoRules: [lowestBandwidth] } });

    await flush();

    expect(state.selectedVideoTrackId.get()).toBe('360p');
    reactor.destroy();
  });

  it('replaces the video pre-pass with videoConstraints', async () => {
    const state = makeState({
      presentation: createPresentation(tracks()),
      bandwidthState: createBandwidthState(10_000_000),
    });
    const reactor = switchVideoTrack.setup({ state, config: { videoConstraints: [pruneAll] } });

    await flush();

    expect(state.selectedVideoTrackId.get()).toBeUndefined();
    reactor.destroy();
  });

  it.each([{ videoConstraints: [pruneAll] }, { videoRules: [lowestBandwidth] }])(
    'keeps audio on its own keys with video override %j',
    async (config) => {
      const state = makeAudioState({
        presentation: createAudioPresentation([
          makeAudioTrack('audio-low', { bandwidth: 128_000 }),
          makeAudioTrack('audio-high', { bandwidth: 256_000 }),
        ]),
        bandwidthState: createBandwidthState(1_000_000),
      });
      const reactor = switchAudioTrack.setup({ state, config });

      await flush();
      expect(state.selectedAudioTrackId.get()).toBe('audio-high');
      reactor.destroy();
    }
  );

  it('replaces the audio pre-pass with audioConstraints', async () => {
    const state = makeAudioState({ presentation: createAudioPresentation([makeAudioTrack('audio-en')]) });
    const reactor = switchAudioTrack.setup({ state, config: { audioConstraints: [() => []] } });

    await flush();

    expect(state.selectedAudioTrackId.get()).toBeUndefined();
    reactor.destroy();
  });
});

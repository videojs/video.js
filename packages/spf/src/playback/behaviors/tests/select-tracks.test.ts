import { describe, expect, it } from 'vite-plus/test';

import type { StateSignals } from '../../../core/composition/define-behavior';
import { signal } from '../../../core/signals/primitives';
import type { SvtaError } from '../../../media/errors';
import type { TrackSelectionState } from '../../../media/primitives/select-tracks';
import type {
  AudioSelectionSet,
  MaybeResolvedPresentation,
  PartiallyResolvedAudioTrack,
  PartiallyResolvedVideoTrack,
  Presentation,
  TextSelectionSet,
  VideoSelectionSet,
} from '../../../media/types';
import { applyRules } from '../../primitives/selection-rules';
import { preferHighestResolution, screenResolutionCap, selectAudioTrack, selectVideoTrack } from '../select-tracks';

function makeState(initial: TrackSelectionState = {}): StateSignals<TrackSelectionState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    selectedVideoTrackId: signal<string | undefined>(initial.selectedVideoTrackId),
    selectedAudioTrackId: signal<string | undefined>(initial.selectedAudioTrackId),
    selectedTextTrackId: signal<string | undefined>(initial.selectedTextTrackId),
  };
}

// Helper to create a minimal presentation
function createPresentation(config: {
  video?: PartiallyResolvedVideoTrack[];
  audio?: PartiallyResolvedAudioTrack[];
  text?: any[];
}): Presentation {
  const selectionSets = [];

  if (config.video && config.video.length > 0) {
    selectionSets.push({
      id: 'video-set',
      type: 'video' as const,
      switchingSets: [
        {
          id: 'video-switching',
          type: 'video' as const,
          tracks: config.video,
        },
      ],
    } as VideoSelectionSet);
  }

  if (config.audio && config.audio.length > 0) {
    selectionSets.push({
      id: 'audio-set',
      type: 'audio' as const,
      switchingSets: [
        {
          id: 'audio-switching',
          type: 'audio' as const,
          tracks: config.audio,
        },
      ],
    } as AudioSelectionSet);
  }

  if (config.text && config.text.length > 0) {
    selectionSets.push({
      id: 'text-set',
      type: 'text' as const,
      switchingSets: [
        {
          id: 'text-switching',
          type: 'text' as const,
          tracks: config.text,
        },
      ],
    } as TextSelectionSet);
  }

  return {
    id: 'pres-1',
    url: 'http://example.com/playlist.m3u8',
    selectionSets,
    startTime: 0,
  };
}

// `selectVideoTrack` is the simple (non-ABR) video selector — ABR-driven
// selection is exercised in `track-switching.test.ts`.

describe('selectVideoTrack', () => {
  it('selects first video track when presentation loaded', async () => {
    const videoTracks: PartiallyResolvedVideoTrack[] = [
      {
        type: 'video',
        id: 'video-low',
        url: 'http://example.com/video-low.m3u8',
        bandwidth: 600_000,
        mimeType: 'video/mp4',
        codecs: ['avc1.4d401f'],
      },
      {
        type: 'video',
        id: 'video-high',
        url: 'http://example.com/video-high.m3u8',
        bandwidth: 2_400_000,
        mimeType: 'video/mp4',
        codecs: ['avc1.4d401f'],
      },
    ];

    const presentation = createPresentation({ video: videoTracks });
    const state = makeState({ presentation });

    const reactor = selectVideoTrack.setup({ state });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedVideoTrackId.get()).toBe('video-low');

    reactor.destroy();
  });

  it('clears selectedVideoTrackId on src unload', async () => {
    const videoTracks: PartiallyResolvedVideoTrack[] = [
      {
        type: 'video',
        id: 'video-only',
        url: 'http://example.com/video-only.m3u8',
        bandwidth: 1_000_000,
        mimeType: 'video/mp4',
        codecs: ['avc1.4d401f'],
      },
    ];

    const presentation = createPresentation({ video: videoTracks });
    const state = makeState({ presentation });

    const reactor = selectVideoTrack.setup({ state });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.selectedVideoTrackId.get()).toBe('video-only');

    state.presentation.set(undefined);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedVideoTrackId.get()).toBeUndefined();

    reactor.destroy();
  });

  it('honors a caller-supplied rule chain', async () => {
    const videoTracks: PartiallyResolvedVideoTrack[] = [
      {
        type: 'video',
        id: 'video-low',
        url: 'http://example.com/video-low.m3u8',
        bandwidth: 600_000,
        mimeType: 'video/mp4',
        codecs: ['avc1.4d401f'],
      },
      {
        type: 'video',
        id: 'video-high',
        url: 'http://example.com/video-high.m3u8',
        bandwidth: 2_400_000,
        mimeType: 'video/mp4',
        codecs: ['avc1.4d401f'],
      },
    ];

    const presentation = createPresentation({ video: videoTracks });
    const state = makeState({ presentation });

    // A narrowing rule replaces the default empty chain, so the pick is the
    // survivor rather than the first candidate.
    const reactor = selectVideoTrack.setup({
      state,
      config: {
        videoRules: [(tracks: readonly { id: string }[]) => tracks.filter((track) => track.id === 'video-high')],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedVideoTrackId.get()).toBe('video-high');

    reactor.destroy();
  });

  it('preserves an offered video pick already selected on entry', async () => {
    const video = (id: string): PartiallyResolvedVideoTrack => ({
      type: 'video',
      id,
      url: `http://example.com/${id}.m3u8`,
      bandwidth: 1_000_000,
      mimeType: 'video/mp4',
      codecs: ['avc1.4d401f'],
    });
    const state = makeState({
      presentation: createPresentation({ video: [video('video-first'), video('video-second')] }),
      selectedVideoTrackId: 'video-second',
    });
    const reactor = selectVideoTrack.setup({ state });

    await Promise.resolve();
    expect(state.selectedVideoTrackId.get()).toBe('video-second');
    reactor.destroy();
  });
});

// The capability pre-pass and the verdict it produces. This is what lets a
// *pinned* selection notice it has gone unplayable: `resolve-track` relabels the
// whole type's container from the first resolved media playlist, long after the
// pick was made under the fMP4 default.
describe('selectVideoTrack — capability constraint + verdict', () => {
  const playable: PartiallyResolvedVideoTrack = {
    type: 'video',
    id: 'video-mp4',
    url: 'http://example.com/video-mp4.m3u8',
    bandwidth: 1_000_000,
    mimeType: 'video/mp4',
    codecs: ['avc1.4d401f'],
  };
  const undecodable: PartiallyResolvedVideoTrack = {
    type: 'video',
    id: 'video-hevc',
    url: 'http://example.com/video-hevc.m3u8',
    bandwidth: 4_000_000,
    mimeType: 'video/mp4',
    codecs: ['hvc1.2.4.L153.B0'],
  };

  /** Rejects anything whose codec list names HEVC — stands in for the DOM probe. */
  const noHevc = (track: { codecs?: string[] }) => !track.codecs?.some((codec) => codec.startsWith('hvc1'));

  function makeErrorState(presentation: MaybeResolvedPresentation) {
    return { ...makeState({ presentation }), errors: signal<SvtaError[] | undefined>(undefined) };
  }

  it('prunes an undecodable rendition before the chain picks', async () => {
    const state = makeErrorState(createPresentation({ video: [undecodable, playable] }));

    const reactor = selectVideoTrack.setup({ state, config: { canPlayTrack: noHevc } });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedVideoTrackId.get()).toBe('video-mp4');
    expect(state.errors.get()).toBeUndefined();

    reactor.destroy();
  });

  it('makes no pick when every rendition is undecodable', async () => {
    const state = makeErrorState(createPresentation({ video: [undecodable] }));

    const reactor = selectVideoTrack.setup({ state, config: { canPlayTrack: noHevc } });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedVideoTrackId.get()).toBeUndefined();
    // No verdict from the behavior itself: reporting an absent type is a
    // constraint a composition opts into — `reportAbsentTrackType`, as the
    // background-video engine does — and the default video constraints are
    // `excludeUnplayableTracks` alone.
    expect(state.errors.get()).toBeUndefined();

    reactor.destroy();
  });

  // The warm path, and the reason this behavior needed an effect rather than
  // entry alone: the pick is made while the type still carries the fMP4 default,
  // and only the later relabel reveals it as MPEG-TS.
  it('clears a pick already made when a later container relabel prunes every rendition', async () => {
    const fmp4Labelled = createPresentation({ video: [{ ...playable, id: 'video-1' }] });
    const state = makeErrorState(fmp4Labelled);

    // The DOM probe's real answer: a non-fMP4 container is unplayable outright.
    const reactor = selectVideoTrack.setup({
      state,
      config: { canPlayTrack: (track: { mimeType?: string }) => track.mimeType !== 'video/mp2t' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.selectedVideoTrackId.get()).toBe('video-1');

    // What `applyContainerMimeType` does once the media playlist resolves with no
    // EXT-X-MAP: relabel every rendition of the type, in a new presentation object.
    state.presentation.set(
      createPresentation({ video: [{ ...playable, id: 'video-1', mimeType: 'video/mp2t' }] }) as Presentation
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedVideoTrackId.get()).toBeUndefined();

    reactor.destroy();
  });

  // The partially-unplayable case, which is how encryption presents: it is detected
  // per media playlist, so a pruned pick can sit beside renditions that still look
  // playable. The pin is dropped rather than moved — moving it would make this
  // `switchVideoTrack` with extra steps — and losing it is the failure, because
  // `entry` has already run and nothing will choose again.
  it('deselects when the pick alone is constrained away', async () => {
    const encrypted = { ...playable, id: 'video-encrypted' };
    const clear = { ...playable, id: 'video-clear' };
    const state = makeErrorState(createPresentation({ video: [encrypted, clear] }));

    // Unplayable only *after* the pick, which is the real sequence: encryption is
    // read off a media playlist, and only the selected rendition's is fetched.
    // Pruning it up front would let `entry` avoid it and never exercise this path.
    let pruneEncrypted = false;
    const reactor = selectVideoTrack.setup({
      state,
      config: {
        // SAFETY: the probe is handed the whole track; `CanPlayTrack` names only the fields real probes read.
        canPlayTrack: (track) => !(pruneEncrypted && (track as { id?: string }).id === 'video-encrypted'),
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.selectedVideoTrackId.get()).toBe('video-encrypted');

    pruneEncrypted = true;
    // Re-notify the candidate set the way committing a resolved track does.
    state.presentation.set(createPresentation({ video: [encrypted, clear] }) as Presentation);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Dropped, not moved to `video-clear`.
    expect(state.selectedVideoTrackId.get()).toBeUndefined();
    // No verdict: a sibling still looks playable, so nothing here can claim the
    // type is unplayable. What made the pick unplayable reported its own cause as
    // the playlist resolved — 4008 for the real encryption case.
    expect(state.errors.get()).toBeUndefined();

    reactor.destroy();
  });

  it('passes every rendition through when no probe is wired', async () => {
    const state = makeErrorState(createPresentation({ video: [undecodable] }));

    const reactor = selectVideoTrack.setup({ state });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedVideoTrackId.get()).toBe('video-hevc');
    expect(state.errors.get()).toBeUndefined();

    reactor.destroy();
  });
});

describe('selectAudioTrack', () => {
  it('picks track matching preferredAudioLanguage when supplied', async () => {
    const audioTracks: PartiallyResolvedAudioTrack[] = [
      {
        type: 'audio',
        id: 'audio-en',
        url: 'http://example.com/audio-en.m3u8',
        bandwidth: 128_000,
        mimeType: 'audio/mp4',
        codecs: ['mp4a.40.2'],
        groupId: 'audio',
        name: 'English',
        language: 'en',
        sampleRate: 48000,
        channels: 2,
      },
      {
        type: 'audio',
        id: 'audio-es',
        url: 'http://example.com/audio-es.m3u8',
        bandwidth: 128_000,
        mimeType: 'audio/mp4',
        codecs: ['mp4a.40.2'],
        groupId: 'audio',
        name: 'Spanish',
        language: 'es',
        sampleRate: 48000,
        channels: 2,
      },
    ];

    const presentation = createPresentation({ audio: audioTracks });
    const state = makeState({ presentation });

    const reactor = selectAudioTrack.setup({ state, config: { preferredAudioLanguage: 'es' } });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedAudioTrackId.get()).toBe('audio-es');

    reactor.destroy();
  });

  it('falls back to DEFAULT=YES track when preferredAudioLanguage does not match', async () => {
    const audioTracks: PartiallyResolvedAudioTrack[] = [
      {
        type: 'audio',
        id: 'audio-en',
        url: 'http://example.com/audio-en.m3u8',
        bandwidth: 128_000,
        mimeType: 'audio/mp4',
        codecs: ['mp4a.40.2'],
        groupId: 'audio',
        name: 'English',
        language: 'en',
        sampleRate: 48000,
        channels: 2,
      },
      {
        type: 'audio',
        id: 'audio-fr',
        url: 'http://example.com/audio-fr.m3u8',
        bandwidth: 128_000,
        mimeType: 'audio/mp4',
        codecs: ['mp4a.40.2'],
        groupId: 'audio',
        name: 'French',
        language: 'fr',
        default: true,
        sampleRate: 48000,
        channels: 2,
      },
    ];

    const presentation = createPresentation({ audio: audioTracks });
    const state = makeState({ presentation });

    // Preferred language 'xx' has no match; picker falls back to the default
    // track ('audio-fr') rather than the first track ('audio-en').
    const reactor = selectAudioTrack.setup({ state, config: { preferredAudioLanguage: 'xx' } });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedAudioTrackId.get()).toBe('audio-fr');

    reactor.destroy();
  });

  it('falls back to first track when no language preference and no DEFAULT track', async () => {
    const audioTracks: PartiallyResolvedAudioTrack[] = [
      {
        type: 'audio',
        id: 'audio-en',
        url: 'http://example.com/audio-en.m3u8',
        bandwidth: 128_000,
        mimeType: 'audio/mp4',
        codecs: ['mp4a.40.2'],
        groupId: 'audio',
        name: 'English',
        language: 'en',
        sampleRate: 48000,
        channels: 2,
      },
      {
        type: 'audio',
        id: 'audio-es',
        url: 'http://example.com/audio-es.m3u8',
        bandwidth: 128_000,
        mimeType: 'audio/mp4',
        codecs: ['mp4a.40.2'],
        groupId: 'audio',
        name: 'Spanish',
        language: 'es',
        sampleRate: 48000,
        channels: 2,
      },
    ];

    const presentation = createPresentation({ audio: audioTracks });
    const state = makeState({ presentation });

    const reactor = selectAudioTrack.setup({ state });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.selectedAudioTrackId.get()).toBe('audio-en');

    reactor.destroy();
  });
});

// ============================================================================
// screenResolutionCap — tested as the pure rule it is, no behavior in the way.
// The composed-chain case at the bottom is the one that matters in practice.
// ============================================================================

describe('preferHighestResolution', () => {
  const noDeps = { state: {}, config: undefined };

  // A ranker, not a picker: it returns the whole reordered set and lets the chain
  // take the head. Returning one track would early-bail `applyRules` and block any
  // rule behind it.
  it('returns every candidate, reordered, rather than a single pick', () => {
    const tracks = [
      { id: '720p', width: 1280, height: 720, bandwidth: 2_000_000 },
      { id: '1440p', width: 2560, height: 1440, bandwidth: 8_000_000 },
      { id: '360p', width: 640, height: 360, bandwidth: 500_000 },
    ];

    expect(preferHighestResolution(tracks, noDeps).map((track) => track.id)).toEqual(['1440p', '720p', '360p']);
  });

  it('does not mutate the candidate list it was given', () => {
    const tracks = [
      { id: '360p', width: 640, height: 360, bandwidth: 500_000 },
      { id: '1080p', width: 1920, height: 1080, bandwidth: 4_000_000 },
    ];

    preferHighestResolution(tracks, noDeps);
    expect(tracks.map((track) => track.id)).toEqual(['360p', '1080p']);
  });
});

describe('screenResolutionCap', () => {
  const ladder = [
    { id: '360p', width: 640, height: 360, bandwidth: 500_000 },
    { id: '1080p', width: 1920, height: 1080, bandwidth: 4_000_000 },
    { id: '1440p', width: 2560, height: 1440, bandwidth: 8_000_000 },
    { id: '2160p', width: 3840, height: 2160, bandwidth: 15_000_000 },
  ];

  // A 16" MBP in its default scaled mode: 3456x2234 device px = 7,720,704.
  const laptopScreen = { width: 3456, height: 2234 };

  function depsWith(screenResolution: { width: number; height: number } | undefined) {
    return { state: { screenResolution: signal(screenResolution) }, config: undefined };
  }

  // Narrows only — the surviving order is the manifest's. Choosing among the
  // survivors is the following ranker's job, exercised at the bottom of this block.
  it('narrows to the renditions that fit the screen', () => {
    const survivors = screenResolutionCap(ladder, depsWith(laptopScreen));

    expect(survivors.map((track) => track.id)).toEqual(['360p', '1080p', '1440p']);
  });

  it('falls through when there is no screen to read', () => {
    expect(screenResolutionCap(ladder, depsWith(undefined))).toEqual([]);
  });

  // Composing the cap without `trackScreenResolution` leaves the slot absent
  // entirely — inert rather than broken, and notably not a cap of zero.
  it('falls through when the composition declares no screenResolution signal', () => {
    expect(screenResolutionCap(ladder, { state: {}, config: undefined })).toEqual([]);
  });

  // No fallback here either — `applyRules` skips an empty result, which is what
  // keeps a cap from ever narrowing the candidates to nothing.
  it('falls through when the screen fits no rendition at all', () => {
    expect(screenResolutionCap(ladder, depsWith({ width: 320, height: 240 }))).toEqual([]);
  });

  it('leaves the chain unnarrowed when nothing fits, so the ranker still decides', () => {
    const deps = depsWith({ width: 320, height: 240 });
    const survivors = applyRules([screenResolutionCap, preferHighestResolution], ladder, deps);

    expect(survivors[0]?.id).toBe('2160p');
  });

  it('picks the largest rendition that fits when composed ahead of the ranker', () => {
    const deps = depsWith(laptopScreen);
    const survivors = applyRules([screenResolutionCap, preferHighestResolution], ladder, deps);

    expect(survivors[0]?.id).toBe('1440p');
  });

  // Order-independent, per the model: a sort reorders whatever survived, and a
  // filter preserves order, so the head is the same either way round.
  it('reaches the same pick with the cap after the ranker', () => {
    const deps = depsWith(laptopScreen);

    expect(applyRules([preferHighestResolution, screenResolutionCap], ladder, deps)[0]?.id).toBe('1440p');
  });
});

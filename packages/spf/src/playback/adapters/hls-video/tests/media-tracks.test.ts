import { HTMLVideoAdapter } from '@videojs/media/dom';
import { MediaTracksMixin } from '@videojs/media/media-tracks';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { effect } from '../../../../core/signals/effect';
import { signal } from '../../../../core/signals/primitives';
import { HlsVideoMediaTracksMixin } from '../media-tracks';

// The projection only touches these five engine-state signals; a fake engine
// backed by real signals is enough to drive the effects.
function createEngine() {
  return {
    state: {
      presentation: signal<any>(undefined),
      selectedVideoTrackId: signal<string | undefined>(undefined),
      selectedAudioTrackId: signal<string | undefined>(undefined),
      userVideoTrackSelection: signal<any>(undefined),
      userAudioTrackSelection: signal<any>(undefined),
    },
  };
}

type Engine = ReturnType<typeof createEngine>;

class FakeHost extends HTMLVideoAdapter {
  engine: Engine;
  constructor(engine: Engine) {
    super();
    this.engine = engine;
  }
}

const HlsVideoMediaTracks = HlsVideoMediaTracksMixin(MediaTracksMixin(FakeHost as any));

const presentation = (video: any[], audio: any[] = [], url = 'https://example.com/master.m3u8') => ({
  id: 'pres-1',
  url,
  selectionSets: [
    { id: 'v', type: 'video', switchingSets: [{ id: 'vs', type: 'video', tracks: video }] },
    { id: 'a', type: 'audio', switchingSets: [{ id: 'as', type: 'audio', tracks: audio }] },
  ],
});

const vTrack = (over: any) => ({
  type: 'video',
  url: 'https://cdn-a/v.m3u8',
  bandwidth: 1_000_000,
  codecs: ['avc1.640028'],
  ...over,
});

const aTrack = (over: any) => ({
  type: 'audio',
  url: 'https://cdn-a/a.m3u8',
  bandwidth: 128_000,
  codecs: ['mp4a.40.2'],
  name: 'Audio',
  ...over,
});

// Flush by riding the same scheduler the projection uses: bump a throwaway
// signal and resolve once its effect re-runs. That re-run lands after the SPF
// effect queue and the microtask-queued track/rendition `change` events have
// drained, so the flush inherits the runtime's timing instead of hard-coding a
// micro/macrotask.
const flush = () =>
  new Promise<void>((resolve) => {
    const sig = signal(0);
    const stop = effect(() => {
      if (sig.get() === 0) return; // skip the synchronous initial run

      stop();
      resolve();
    });

    sig.set(1);
  });

describe('HlsVideoMediaTracksMixin', () => {
  let engine: Engine;
  let host: any;

  beforeEach(() => {
    engine = createEngine();
    host = new HlsVideoMediaTracks(engine) as any;
  });

  afterEach(() => {
    host.destroy();
  });

  it('projects video renditions into a selected main track, deduped by w/h/bandwidth', async () => {
    engine.state.presentation.set(
      presentation([
        vTrack({ id: 'a-1080', width: 1920, height: 1080, bandwidth: 5_000_000, url: 'https://a/v.m3u8' }),
        vTrack({ id: 'b-1080', width: 1920, height: 1080, bandwidth: 5_000_000, url: 'https://b/v.m3u8' }),
        vTrack({ id: 'a-720', width: 1280, height: 720, bandwidth: 3_000_000 }),
      ])
    );
    await flush();

    expect(host.videoTracks.length).toBe(1);
    expect(host.videoTracks[0].selected).toBe(true);
    expect([...host.videoRenditions].map((r: any) => r.id)).toEqual(['a-1080', 'a-720']);
    expect([...host.videoRenditions].map((r: any) => r.height)).toEqual([1080, 720]);
    expect(host.videoRenditions[0].codec).toBe('avc1.640028');
  });

  it('maps a rational frame rate onto the DOM rendition as a number', async () => {
    engine.state.presentation.set(
      presentation([
        vTrack({
          id: 'v1',
          width: 1920,
          height: 1080,
          frameRate: { frameRateNumerator: 30000, frameRateDenominator: 1001 },
        }),
        vTrack({ id: 'v2', width: 640, height: 360, bandwidth: 800_000 }),
      ])
    );
    await flush();

    expect(host.videoRenditions[0].frameRate).toBeCloseTo(29.97, 2);
    // No FRAME-RATE on the source → undefined, not coerced to 0.
    expect(host.videoRenditions[1].frameRate).toBeUndefined();
  });

  it('projects audio tracks by language and enables the resolved one', async () => {
    engine.state.selectedAudioTrackId.set('en');
    engine.state.presentation.set(
      presentation(
        [],
        [
          aTrack({ id: 'en', language: 'en', name: 'English', default: true }),
          aTrack({ id: 'es', language: 'es', name: 'Spanish' }),
        ]
      )
    );
    await flush();

    expect([...host.audioTracks].map((t: any) => t.language)).toEqual(['en', 'es']);
    expect([...host.audioTracks].map((t: any) => t.label)).toEqual(['English', 'Spanish']);
    expect(host.audioTracks[0].enabled).toBe(true);
    expect(host.audioTracks[1].enabled).toBe(false);
  });

  it('reflects the resolved video selection as active', async () => {
    engine.state.presentation.set(
      presentation([
        vTrack({ id: 'hi', width: 1920, height: 1080, bandwidth: 5_000_000 }),
        vTrack({ id: 'lo', width: 640, height: 360, bandwidth: 800_000 }),
      ])
    );
    await flush();

    engine.state.selectedVideoTrackId.set('lo');
    await flush();

    expect([...host.videoRenditions].map((r: any) => r.active)).toEqual([false, true]);
  });

  it('reflects active by properties, so a non-primary CDN resolved id still lights up its rendition', async () => {
    engine.state.presentation.set(
      presentation([
        vTrack({ id: 'a-1080', width: 1920, height: 1080, bandwidth: 5_000_000, url: 'https://a/v.m3u8' }),
        vTrack({ id: 'b-1080', width: 1920, height: 1080, bandwidth: 5_000_000, url: 'https://b/v.m3u8' }),
        vTrack({ id: 'a-720', width: 1280, height: 720, bandwidth: 3_000_000 }),
      ])
    );
    await flush();

    // The DOM rendition kept the first copy's id ('a-1080'); the engine resolved
    // the second-CDN copy (as on failover). Property-based reflection still marks
    // the collapsed rendition active.
    engine.state.selectedVideoTrackId.set('b-1080');
    await flush();

    expect([...host.videoRenditions].map((r: any) => r.id)).toEqual(['a-1080', 'a-720']);
    expect([...host.videoRenditions].map((r: any) => r.active)).toEqual([true, false]);
  });

  it('reflects audio enabled by properties across per-CDN copies', async () => {
    engine.state.presentation.set(
      presentation(
        [],
        [
          aTrack({ id: 'en-a', language: 'en', name: 'English', url: 'https://a/a.m3u8' }),
          aTrack({ id: 'en-b', language: 'en', name: 'English', url: 'https://b/a.m3u8' }),
          aTrack({ id: 'es-a', language: 'es', name: 'Spanish' }),
        ]
      )
    );
    await flush();

    engine.state.selectedAudioTrackId.set('en-b');
    await flush();

    expect([...host.audioTracks].map((t: any) => t.id)).toEqual(['en-a', 'es-a']);
    expect([...host.audioTracks].map((t: any) => t.enabled)).toEqual([true, false]);
  });

  it('pins a rendition selection as width/height/bandwidth criteria; Auto clears it', async () => {
    engine.state.presentation.set(
      presentation([
        vTrack({ id: 'hi', width: 1920, height: 1080, bandwidth: 5_000_000 }),
        vTrack({ id: 'lo', width: 640, height: 360, bandwidth: 800_000 }),
      ])
    );
    await flush();

    host.videoRenditions.selectedIndex = 1;
    await flush();
    expect(engine.state.userVideoTrackSelection.get()).toEqual({ width: 640, height: 360, bandwidth: 800_000 });

    host.videoRenditions.selectedIndex = -1;
    await flush();
    expect(engine.state.userVideoTrackSelection.get()).toBeUndefined();
  });

  it('pins an audio selection as a language criterion when the user selects another track', async () => {
    engine.state.selectedAudioTrackId.set('en');
    engine.state.presentation.set(
      presentation(
        [],
        [
          aTrack({ id: 'en', language: 'en', name: 'English', default: true }),
          aTrack({ id: 'es', language: 'es', name: 'Spanish' }),
        ]
      )
    );
    await flush();

    // Exclusive selection, as the audio-track store feature drives it.
    host.audioTracks[0].enabled = false;
    host.audioTracks[1].enabled = true;
    await flush();

    expect(engine.state.userAudioTrackSelection.get()).toEqual({ language: 'es', name: 'Spanish' });
  });

  it('does not write a selection when reflection enables the resolved track', async () => {
    // The host (built in beforeEach) is wired for side effects; asserted via engine state below.
    engine.state.selectedAudioTrackId.set('en');
    engine.state.presentation.set(
      presentation([], [aTrack({ id: 'en', language: 'en', default: true }), aTrack({ id: 'es', language: 'es' })])
    );
    await flush();

    expect(engine.state.userAudioTrackSelection.get()).toBeUndefined();
  });

  it('preserves renditions across a live-reload presentation swap with the same set', async () => {
    const tracks = [
      vTrack({ id: 'hi', width: 1920, height: 1080, bandwidth: 5_000_000 }),
      vTrack({ id: 'lo', width: 640, height: 360, bandwidth: 800_000 }),
    ];

    engine.state.presentation.set(presentation(tracks));
    await flush();
    engine.state.selectedVideoTrackId.set('lo');
    await flush();

    const mainTrack = host.videoTracks[0];
    const renditions = [...host.videoRenditions];

    // New presentation object, identical rendition set (as a live refresh does).
    engine.state.presentation.set(presentation(tracks.map((t) => ({ ...t }))));
    await flush();

    // A reload preserves the objects consumers already hold, as well as their state.
    expect(host.videoTracks[0]).toBe(mainTrack);
    expect(host.videoRenditions.length).toBe(renditions.length);

    for (const [index, rendition] of renditions.entries()) {
      expect(host.videoRenditions[index]).toBe(rendition);
    }

    expect([...host.videoRenditions].map((r: any) => r.active)).toEqual([false, true]);
  });

  it('clears the pinned rendition and audio selection when the source changes', async () => {
    engine.state.selectedAudioTrackId.set('en');
    engine.state.presentation.set(
      presentation(
        [
          vTrack({ id: 'hi', width: 1920, height: 1080, bandwidth: 5_000_000 }),
          vTrack({ id: 'lo', width: 640, height: 360, bandwidth: 800_000 }),
        ],
        [
          aTrack({ id: 'en', language: 'en', name: 'English', default: true }),
          aTrack({ id: 'es', language: 'es', name: 'Spanish' }),
        ]
      )
    );
    await flush();

    // User pins a rendition and switches to an alternate audio track.
    host.videoRenditions.selectedIndex = 1;
    host.audioTracks[0].enabled = false;
    host.audioTracks[1].enabled = true;
    await flush();
    expect(engine.state.userVideoTrackSelection.get()).toEqual({ width: 640, height: 360, bandwidth: 800_000 });
    expect(engine.state.userAudioTrackSelection.get()).toEqual({ language: 'es', name: 'Spanish' });

    // A different source (new manifest URL) drops both pins so the engine re-picks.
    engine.state.presentation.set(
      presentation(
        [vTrack({ id: 'hi2', width: 1920, height: 1080, bandwidth: 5_000_000 })],
        [aTrack({ id: 'en2', language: 'en', name: 'English', default: true })],
        'https://example.com/other.m3u8'
      )
    );
    await flush();

    expect(engine.state.userVideoTrackSelection.get()).toBeUndefined();
    expect(engine.state.userAudioTrackSelection.get()).toBeUndefined();
  });

  it('keeps the pinned rendition across a same-URL live reload', async () => {
    const tracks = [
      vTrack({ id: 'hi', width: 1920, height: 1080, bandwidth: 5_000_000 }),
      vTrack({ id: 'lo', width: 640, height: 360, bandwidth: 800_000 }),
    ];

    engine.state.presentation.set(presentation(tracks));
    await flush();

    host.videoRenditions.selectedIndex = 1;
    await flush();
    expect(engine.state.userVideoTrackSelection.get()).toEqual({ width: 640, height: 360, bandwidth: 800_000 });

    // Live reload: same URL, new presentation object — the pin must survive.
    engine.state.presentation.set(presentation(tracks.map((t) => ({ ...t }))));
    await flush();
    expect(engine.state.userVideoTrackSelection.get()).toEqual({ width: 640, height: 360, bandwidth: 800_000 });
  });

  it('clears tracks when the source is unset', async () => {
    engine.state.presentation.set(presentation([vTrack({ id: 'hi', width: 1920, height: 1080 })]));
    await flush();
    expect(host.videoRenditions.length).toBe(1);

    engine.state.presentation.set(undefined);
    await flush();
    expect(host.videoTracks.length).toBe(0);
    expect(host.videoRenditions.length).toBe(0);
  });

  it('disposes effects and clears tracks on destroy', async () => {
    engine.state.presentation.set(presentation([vTrack({ id: 'hi' })], [aTrack({ id: 'en', language: 'en' })]));
    await flush();
    expect(host.videoTracks.length).toBe(1);

    host.destroy();
    expect(host.videoTracks.length).toBe(0);
    expect(host.audioTracks.length).toBe(0);

    // Effects are torn down: further presentation changes are ignored.
    engine.state.presentation.set(presentation([vTrack({ id: 'other' })]));
    await flush();
    expect(host.videoTracks.length).toBe(0);
  });
});

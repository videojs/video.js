import { describe, expect, it, vi } from 'vite-plus/test';

import { removeHlsTextTracks, withPreservedTextTracks } from '../text-tracks';

/**
 * Jsdom has no text track implementation, so the media element and its tracks are stubbed with the parts the helper
 * touches: `cues` reads as `null` while a track is disabled, exactly as the spec requires.
 */
class FakeTextTrack {
  #mode: TextTrackMode = 'disabled';

  get mode(): TextTrackMode {
    return this.#mode;
  }

  set mode(value: TextTrackMode) {
    this.#mode = value;
  }
  #cues: TextTrackCue[] = [];

  get cues(): TextTrackCue[] | null {
    return this.mode === 'disabled' ? null : this.#cues;
  }

  addCue(cue: TextTrackCue) {
    this.#cues.push(cue);
  }

  /** Mirrors hls.js's `clearCurrentCues()`, which reads cues through `hidden`. */
  clearCues() {
    const { mode } = this;

    if (mode === 'disabled') this.mode = 'hidden';

    this.#cues = [];

    if (mode === 'disabled') this.mode = mode;
  }
}

interface FakeTrackElementInit {
  mode?: TextTrackMode;
  cues?: string[];
  readyState?: number;
  hlsOwned?: boolean;
}

function fakeTrackElement({ mode = 'showing', cues = [], readyState = 2, hlsOwned = false }: FakeTrackElementInit) {
  const track = new FakeTextTrack();

  track.mode = 'hidden';

  for (const id of cues) track.addCue({ id } as TextTrackCue);

  track.mode = mode;

  return {
    track,
    readyState,
    hasAttribute: (name: string) => hlsOwned && name === 'data-removeondestroy',
  };
}

function fakeMedia(...trackEls: ReturnType<typeof fakeTrackElement>[]) {
  return { querySelectorAll: () => trackEls } as unknown as HTMLMediaElement;
}

function cueIds(track: FakeTextTrack): string[] {
  const { mode } = track;

  if (mode === 'disabled') track.mode = 'hidden';

  const ids = (track.cues ?? []).map((cue) => cue.id);

  track.mode = mode;
  return ids;
}

describe('withPreservedTextTracks', () => {
  it('puts back cues the action removed from a sideloaded track', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one', 'two'] });

    withPreservedTextTracks(fakeMedia(trackEl), () => trackEl.track.clearCues());

    expect(cueIds(trackEl.track)).toEqual(['one', 'two']);
  });

  it('puts back the mode the action changed', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one'] });

    withPreservedTextTracks(fakeMedia(trackEl), () => {
      trackEl.track.clearCues();
      trackEl.track.mode = 'disabled';
    });

    expect(trackEl.track.mode).toBe('showing');
    expect(cueIds(trackEl.track)).toEqual(['one']);
  });

  it('keeps cues the action left alone from being added twice', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one'] });

    withPreservedTextTracks(fakeMedia(trackEl), () => {
      trackEl.track.addCue({ id: 'two' } as TextTrackCue);
    });

    expect(cueIds(trackEl.track)).toEqual(['one', 'two']);
  });

  it('restores a disabled track that already loaded its cues', () => {
    const trackEl = fakeTrackElement({ mode: 'disabled', cues: ['one'], readyState: 2 });

    withPreservedTextTracks(fakeMedia(trackEl), () => trackEl.track.clearCues());

    expect(trackEl.track.mode).toBe('disabled');
    expect(cueIds(trackEl.track)).toEqual(['one']);
  });

  it('does not touch the mode of a disabled track that never loaded', () => {
    const trackEl = fakeTrackElement({ mode: 'disabled', readyState: 0 });
    const setMode = vi.spyOn(trackEl.track, 'mode', 'set');

    withPreservedTextTracks(fakeMedia(trackEl), () => {});

    expect(setMode).not.toHaveBeenCalled();
  });

  it('leaves the tracks hls.js owns to hls.js', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one'], hlsOwned: true });

    withPreservedTextTracks(fakeMedia(trackEl), () => {
      trackEl.track.clearCues();
      trackEl.track.mode = 'disabled';
    });

    expect(trackEl.track.mode).toBe('disabled');
    expect(cueIds(trackEl.track)).toEqual([]);
  });

  it('restores when the action throws', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one'] });

    expect(() =>
      withPreservedTextTracks(fakeMedia(trackEl), () => {
        trackEl.track.clearCues();
        throw new Error('attach failed');
      })
    ).toThrow('attach failed');

    expect(cueIds(trackEl.track)).toEqual(['one']);
  });

  it('runs the action without a media element', () => {
    const action = vi.fn();

    withPreservedTextTracks(null, action);

    expect(action).toHaveBeenCalledOnce();
  });
});

describe('removeHlsTextTracks', () => {
  it('disables hls.js tracks before removing them', () => {
    const actions: string[] = [];
    const media = document.createElement('video');
    const trackEl = document.createElement('track');
    const remove = trackEl.remove.bind(trackEl);

    trackEl.setAttribute('data-removeondestroy', '');
    Object.defineProperty(trackEl, 'track', {
      value: {
        set mode(mode: TextTrackMode) {
          actions.push(`mode:${mode}`);
        },
      },
    });
    vi.spyOn(trackEl, 'remove').mockImplementation(() => {
      actions.push('remove');
      remove();
    });
    media.append(trackEl);

    removeHlsTextTracks(media);

    expect(actions).toEqual(['mode:disabled', 'remove']);
  });

  it('does nothing without a media element', () => {
    expect(() => removeHlsTextTracks(null)).not.toThrow();
  });
});

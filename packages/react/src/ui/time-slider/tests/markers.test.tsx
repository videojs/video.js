import { cleanup, render } from '@testing-library/react';
import type { MediaTextCue, MediaTextTrack, MediaTrackCues, TextTrackFilter } from '@videojs/media';
import type { HTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createSliderPlayerWrapper } from '../../slider/tests/support';
import { TimeSliderMarkers, type TimeSliderMarkersState } from '../markers';
import { TimeSliderRoot } from '../root';

function track(id: string, label: string): MediaTextTrack {
  return { id, kind: 'metadata', label, language: '', mode: 'hidden', source: 'media' };
}

function cue(id: string, startTime: number, endTime = startTime): MediaTextCue {
  return { id, startTime, endTime, text: '' };
}

const adBreak = cue('ad-break', 30);
const sponsor = cue('sponsor', 60, 90);
const highlight = cue('highlight', 12);

const ads: MediaTrackCues = { track: track('ads', 'ads'), cues: [adBreak, sponsor], activeCues: [sponsor] };
const highlights: MediaTrackCues = { track: track('highlights', 'highlights'), cues: [highlight], activeCues: [] };

const stopWatching = vi.fn();
const watchTextCues = vi.fn((_filter: TextTrackFilter) => stopWatching);

interface TestPlayerState {
  duration?: number;
  seekable?: [number, number][];
  textCues?: MediaTrackCues[] | undefined;
  watchTextCues?: typeof watchTextCues | undefined;
}

function createPlayerWrapper(state: TestPlayerState = {}) {
  return createSliderPlayerWrapper({
    currentTime: 70,
    duration: 120,
    seeking: false,
    seek: vi.fn(),
    buffered: [],
    seekable: [[0, 120]],
    textCues: [ads, highlights],
    watchTextCues,
    addTextTrack: vi.fn(),
    removeTextTrack: vi.fn(),
    ...state,
  });
}

function drawn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('.marker')];
}

afterEach(() => {
  cleanup();
  watchTextCues.mockClear();
  stopWatching.mockClear();
});

describe('TimeSliderMarkers', () => {
  it('draws a marker for each cue on the tracks its filter matches', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderMarkers
            className="markers"
            filter={{ label: 'ads' }}
            renderMarker={(props) => <span {...props} className="marker" />}
          />
        </TimeSliderRoot>
      </Wrapper>
    );

    const [point, range] = drawn(container);

    expect(drawn(container)).toHaveLength(2);
    expect(point?.hasAttribute('data-point')).toBe(true);
    expect(point?.hasAttribute('data-active')).toBe(false);
    expect(point?.getAttribute('data-orientation')).toBe('horizontal');
    expect(point?.style.getPropertyValue('--media-slider-marker-start')).toBe('25%');
    expect(point?.style.getPropertyValue('--media-slider-marker-end')).toBe('25%');
    expect(point?.style.getPropertyValue('--media-slider-marker-width')).toBe('0%');
    expect(range?.hasAttribute('data-point')).toBe(false);
    expect(range?.hasAttribute('data-active')).toBe(true);
    expect(range?.style.getPropertyValue('--media-slider-marker-start')).toBe('50%');
    expect(range?.style.getPropertyValue('--media-slider-marker-end')).toBe('75%');
    expect(range?.style.getPropertyValue('--media-slider-marker-width')).toBe('25%');
  });

  it('hides the markers from assistive technology', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderMarkers className="markers" filter={{ label: 'ads' }} />
        </TimeSliderRoot>
      </Wrapper>
    );

    const markers = container.querySelector('.markers');

    expect(markers?.getAttribute('aria-hidden')).toBe('true');
    expect(markers?.getAttribute('data-orientation')).toBe('horizontal');
    expect(markers?.querySelectorAll(':scope > div')).toHaveLength(2);
  });

  it('asks the store to read the matching tracks while mounted', () => {
    const { Wrapper } = createPlayerWrapper();
    const { rerender, unmount } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderMarkers filter={{ label: 'ads' }} />
        </TimeSliderRoot>
      </Wrapper>
    );

    expect(watchTextCues).toHaveBeenCalledExactlyOnceWith({ label: 'ads' });

    rerender(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderMarkers filter={{ label: 'ads' }} />
        </TimeSliderRoot>
      </Wrapper>
    );

    expect(watchTextCues).toHaveBeenCalledOnce();

    unmount();

    expect(stopWatching).toHaveBeenCalledOnce();
  });

  it('marks markers active as their cues become active', () => {
    const { Wrapper, update } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderMarkers
            filter={{ label: 'ads' }}
            renderMarker={(props) => <span {...props} className="marker" />}
          />
        </TimeSliderRoot>
      </Wrapper>
    );

    const [point, range] = drawn(container);

    update({ textCues: [{ ...ads, activeCues: [adBreak] }, highlights] });

    expect(drawn(container)).toEqual([point, range]);
    expect(point?.hasAttribute('data-active')).toBe(true);
    expect(range?.hasAttribute('data-active')).toBe(false);
  });

  it('places markers on the seekable range when the duration is unknown', () => {
    const { Wrapper } = createPlayerWrapper({ duration: Number.POSITIVE_INFINITY, seekable: [[0, 240]] });
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderMarkers
            filter={{ label: 'ads' }}
            renderMarker={(props) => <span {...props} className="marker" />}
          />
        </TimeSliderRoot>
      </Wrapper>
    );

    expect(drawn(container).map((marker) => marker.style.getPropertyValue('--media-slider-marker-start'))).toEqual([
      '12.5%',
      '25%',
    ]);
  });

  it('provides the markers to collection callbacks and each marker state to renderMarker', () => {
    const className = vi.fn((_state: TimeSliderMarkersState) => 'markers');
    const renderRoot = vi.fn((props: HTMLAttributes<HTMLElement>, state: TimeSliderMarkersState) => (
      <section {...props} data-count={state.markers.length} />
    ));
    const renderMarker = vi.fn((props: HTMLAttributes<HTMLElement>) => <span {...props} className="marker" />);
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderMarkers
            className={className}
            filter={(candidate) => candidate.label === 'highlights'}
            render={renderRoot}
            renderMarker={renderMarker}
          />
        </TimeSliderRoot>
      </Wrapper>
    );

    expect(className.mock.calls[0]?.[0].markers).toHaveLength(1);
    expect(container.querySelector('section.markers')?.getAttribute('data-count')).toBe('1');
    expect(renderMarker).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ cue: highlight, point: true, startPercent: '10%' })
    );
  });

  it('draws nothing while the store has no text cues', () => {
    const { Wrapper } = createPlayerWrapper({ textCues: undefined, watchTextCues: undefined });
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderMarkers className="markers" filter={{ label: 'ads' }} />
        </TimeSliderRoot>
      </Wrapper>
    );

    expect(container.querySelector('.markers')?.children).toHaveLength(0);
  });
});

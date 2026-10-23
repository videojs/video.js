import { defineTextTrack, SliderDataAttrs, type SliderState } from '@videojs/core';
import type { AnyPlayerStore, PlayerTarget } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaTextCue, MediaTextTrack, MediaTrackCues, TextTrackFilter } from '@videojs/media';
import { createStore, flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { sliderContext } from '../../slider/context';
import { UIElement } from '../../ui-element';
import { TimeSliderMarkersElement } from '../markers';

let tagCounter = 0;

/** Defines a fresh subclass under a unique tag, so each test gets an upgraded instance. */
function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = `test-markers-el-${tagCounter++}`;

  // SAFETY: every `Base` passed here is a concrete custom element class.
  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  // SAFETY: the tag was just defined with a subclass of `Base`.
  return document.createElement(tag) as Element;
}

function track(id: string, label: string, kind: MediaTextTrack['kind'] = 'metadata'): MediaTextTrack {
  return { id, kind, label, language: '', mode: 'hidden', source: 'media' };
}

function cue(id: string, startTime: number, endTime = startTime): MediaTextCue {
  return { id, startTime, endTime, text: '' };
}

const adBreak = cue('ad-break', 25);
const sponsor = cue('sponsor', 50, 75);
const highlight = cue('highlight', 10);

const ads: MediaTrackCues = { track: track('ads', 'ads'), cues: [adBreak, sponsor], activeCues: [sponsor] };
const highlights: MediaTrackCues = { track: track('highlights', 'highlights'), cues: [highlight], activeCues: [] };

const stopWatching = vi.fn();
const watchTextCues = vi.fn((_filter: TextTrackFilter) => stopWatching);

interface TestPlayerState {
  duration: number;
  seekable: [number, number][];
  textCues: MediaTrackCues[];
}

class TestPlayerElement extends UIElement {
  set!: (patch: Partial<TestPlayerState>) => void;

  // SAFETY: minimal test store; the element only reads the time, buffer, and text cue slices declared below.
  readonly store = createStore<PlayerTarget>()({
    name: 'markers',
    state: ({ set }) => {
      this.set = set;

      return {
        currentTime: 60,
        duration: 100,
        seeking: false,
        seek: vi.fn(),
        buffered: [],
        seekable: [],
        textCues: [ads, highlights],
        watchTextCues,
        addTextTrack: vi.fn(),
        removeTextTrack: vi.fn(),
      };
    },
  }) as AnyPlayerStore;

  readonly provider = new ContextProvider(this, { context: playerContext, initialValue: this.store });
}

class TestSliderElement extends UIElement {
  readonly provider = new ContextProvider(this, { context: sliderContext, initialValue: createSliderContext() });
}

function createSliderContext(state: Partial<SliderState> = {}) {
  return {
    state: {
      value: 60,
      fillPercent: 60,
      pointerPercent: 0,
      dragging: false,
      pointing: false,
      interactive: false,
      orientation: 'horizontal' as const,
      disabled: false,
      thumbAlignment: 'center' as const,
      ...state,
    },
    stateAttrMap: SliderDataAttrs,
    pointerValue: 0,
    thumbAttrs: {},
    thumbProps: { onKeyDownCapture: () => {}, onFocus: () => {}, onBlur: () => {} },
  };
}

async function render(setup: (markers: TimeSliderMarkersElement) => void = () => {}) {
  const player = createElement(TestPlayerElement);
  const slider = createElement(TestSliderElement);
  const markers = createElement(TimeSliderMarkersElement);

  setup(markers);
  slider.appendChild(markers);
  player.appendChild(slider);
  document.body.appendChild(player);
  await markers.updateComplete;

  return { player, slider, markers };
}

async function updateStore(
  player: TestPlayerElement,
  markers: TimeSliderMarkersElement,
  patch: Partial<TestPlayerState>
) {
  player.set(patch);
  flush();
  await markers.updateComplete;
}

function drawn(markers: TimeSliderMarkersElement): HTMLElement[] {
  return [...markers.children].filter((child): child is HTMLElement => child.localName !== 'template');
}

afterEach(() => {
  document.body.innerHTML = '';
  watchTextCues.mockClear();
  stopWatching.mockClear();
});

describe('TimeSliderMarkersElement', () => {
  it('draws a marker for each cue on the tracks its attributes match', async () => {
    const { markers } = await render((element) => element.setAttribute('label', 'ads'));
    const [point, range] = drawn(markers);

    expect(drawn(markers)).toHaveLength(2);
    expect(point?.localName).toBe('div');
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

  it('hides the markers from assistive technology', async () => {
    const { markers } = await render((element) => element.setAttribute('label', 'ads'));

    expect(markers.getAttribute('aria-hidden')).toBe('true');
    expect(markers.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('asks the store to read the matching tracks while connected', async () => {
    const { markers } = await render((element) => {
      element.setAttribute('kind', 'metadata');
      element.setAttribute('label', 'ads');
    });

    expect(watchTextCues).toHaveBeenCalledOnce();
    expect(watchTextCues).toHaveBeenCalledWith({ kind: 'metadata', label: 'ads', language: undefined });

    markers.setAttribute('label', 'highlights');
    await markers.updateComplete;

    expect(stopWatching).toHaveBeenCalledOnce();
    expect(watchTextCues).toHaveBeenLastCalledWith({ kind: 'metadata', label: 'highlights', language: undefined });
    expect(drawn(markers).map((marker) => marker.style.getPropertyValue('--media-slider-marker-start'))).toEqual([
      '10%',
    ]);

    markers.remove();

    expect(stopWatching).toHaveBeenCalledTimes(2);
  });

  it('draws nothing and watches nothing without a filter', async () => {
    const { markers } = await render();

    expect(drawn(markers)).toHaveLength(0);
    expect(watchTextCues).not.toHaveBeenCalled();
  });

  it('prefers the filter property over the attributes', async () => {
    const filter = (candidate: MediaTextTrack) => candidate.id === 'highlights';
    const { markers } = await render((element) => {
      element.setAttribute('label', 'ads');
      element.filter = filter;
    });

    expect(watchTextCues).toHaveBeenCalledExactlyOnceWith(filter);
    expect(drawn(markers)).toHaveLength(1);

    markers.filter = defineTextTrack({ kind: 'metadata', label: 'ads' });
    await markers.updateComplete;

    expect(stopWatching).toHaveBeenCalledOnce();
    expect(drawn(markers)).toHaveLength(2);

    markers.filter = undefined;
    await markers.updateComplete;

    expect(watchTextCues).toHaveBeenLastCalledWith({ kind: undefined, label: 'ads', language: undefined });
    expect(drawn(markers)).toHaveLength(2);
  });

  it('keeps each marker node while its cue stays', async () => {
    const { player, markers } = await render((element) => element.setAttribute('label', 'ads'));
    const [point, range] = drawn(markers);

    await updateStore(player, markers, { textCues: [{ ...ads, activeCues: [adBreak] }, highlights] });

    expect(drawn(markers)).toEqual([point, range]);
    expect(point?.hasAttribute('data-active')).toBe(true);
    expect(range?.hasAttribute('data-active')).toBe(false);

    await updateStore(player, markers, { textCues: [{ ...ads, cues: [sponsor], activeCues: [] }, highlights] });

    expect(drawn(markers)).toEqual([range]);
  });

  it('places markers on the seekable range when the duration is unknown', async () => {
    const { player, markers } = await render((element) => element.setAttribute('label', 'ads'));

    await updateStore(player, markers, { duration: Number.POSITIVE_INFINITY, seekable: [[0, 200]] });

    expect(drawn(markers).map((marker) => marker.style.getPropertyValue('--media-slider-marker-start'))).toEqual([
      '12.5%',
      '25%',
    ]);
  });

  it('clones its template for each marker', async () => {
    const { markers } = await render((element) => {
      const template = document.createElement('template');

      template.innerHTML = '<span class="marker"></span>';
      element.setAttribute('label', 'ads');
      element.append(document.createElement('p'), template);
    });

    expect(markers.querySelector('p')).toBeNull();
    expect(markers.querySelectorAll('span.marker')).toHaveLength(2);
    expect(markers.querySelector('template')).toBeTruthy();
  });

  it('redraws markers from a template that arrives later', async () => {
    const { markers } = await render((element) => element.setAttribute('label', 'ads'));
    const template = document.createElement('template');

    template.innerHTML = '<span class="marker"></span>';
    markers.appendChild(template);
    markers.requestUpdate();
    await markers.updateComplete;

    expect(markers.querySelectorAll('div')).toHaveLength(0);
    expect(markers.querySelectorAll('span.marker')).toHaveLength(2);
  });
});

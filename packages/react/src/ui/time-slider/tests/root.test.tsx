import { act, cleanup, render } from '@testing-library/react';
import { formatTimeAsPhrase } from '@videojs/utils/time';
import type { HTMLAttributes } from 'react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { I18nProvider } from '../../../i18n';
import { createPlayerWrapper } from '../../../testing/mocks';
import { SliderBuffer } from '../../slider/buffer';
import { SliderFill } from '../../slider/fill';
import { SliderThumb } from '../../slider/thumb';
import { SliderTrack } from '../../slider/track';
import { SliderValue } from '../../slider/value';
import { TimeSliderChapterTitle } from '../chapter-title';
import { TimeSliderChapters, type TimeSliderChaptersState } from '../chapters';
import { TimeSliderRoot } from '../root';

// --- Hoisted mock data (available inside vi.mock factories) ---

const {
  mockSliderApi,
  mockSliderInput,
  mockTimeState,
  mockBufferState,
  mockPlaybackState,
  mockTextTrackState,
  mockNoBuffer,
  capturedSliderOptions,
} = vi.hoisted(() => {
  const capturedSliderOptions: {
    current: { onDragStart?: () => void; onDragEnd?: () => void; onValueCommit?: (percent: number) => void };
  } = {
    current: {},
  };
  const mockSliderInput = {
    pointerPercent: 0,
    dragPercent: 0,
    dragging: false,
    pointing: false,
    focused: false,
  };

  return {
    mockSliderApi: (options: { onDragStart?: () => void; onDragEnd?: () => void }) => {
      capturedSliderOptions.current = options;
      return {
        input: {
          current: mockSliderInput,
          subscribe: vi.fn(() => vi.fn()),
        },
        rootProps: {
          onPointerDown: vi.fn(),
          onPointerMove: vi.fn(),
          onPointerLeave: vi.fn(),
        },
        thumbProps: {
          onKeyDownCapture: vi.fn(),
          onFocus: vi.fn(),
          onBlur: vi.fn(),
        },
        adjustForAlignment: <S,>(state: S): S => state,
        destroy: vi.fn(),
      };
    },
    mockSliderInput,
    mockTimeState: {
      currentTime: 30,
      duration: 120,
      seeking: false,
      seek: vi.fn(),
    },
    mockBufferState: {
      buffered: [[0, 60]] as [number, number][],
      seekable: [[0, 120]] as [number, number][],
    },
    mockPlaybackState: {
      paused: false,
      ended: false,
      started: true,
      waiting: false,
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn(),
    },
    mockTextTrackState: {
      textTrackList: [],
      subtitlesShowing: false,
      toggleSubtitles: vi.fn(() => false),
      selectSubtitlesTrack: vi.fn(),
      chaptersCues: [
        { id: 'first', startTime: 0, endTime: 40, text: 'First' },
        { id: 'second', startTime: 60, endTime: 120, text: 'Second' },
      ],
      thumbnailsTrack: null,
    },
    mockNoBuffer: { value: false },
    capturedSliderOptions,
  };
});

// --- Module mocks ---

vi.mock('@videojs/core/dom', async (importOriginal) => {
  const orig: Record<string, unknown> = await importOriginal();

  return { ...orig, createSlider: vi.fn(mockSliderApi) };
});

vi.mock('@videojs/store/react', () => ({
  useSnapshot: vi.fn((state: { current: unknown }) => state.current),
  useStore: vi.fn((_store: unknown, selector?: (state: object) => unknown) => {
    if (!selector) return _store;

    try {
      const result = selector({
        time: mockTimeState,
        buffer: mockBufferState,
        playback: mockPlaybackState,
        textTrack: mockTextTrackState,
      });
      if (result !== undefined) return result;
    } catch {
      // fall through
    }

    try {
      const state = { ...mockTimeState, ...mockPlaybackState, ...mockTextTrackState };

      if (!mockNoBuffer.value) Object.assign(state, mockBufferState);

      return selector(state);
    } catch {
      return undefined;
    }
  }),
}));

afterEach(() => {
  cleanup();
  Object.assign(mockSliderInput, {
    pointerPercent: 0,
    dragPercent: 0,
    dragging: false,
    pointing: false,
    focused: false,
  });
  mockTimeState.duration = 120;
  mockBufferState.seekable = [[0, 120]];
  mockNoBuffer.value = false;
  mockTimeState.seek.mockClear();
});

// --- Tests ---

describe('TimeSliderRoot', () => {
  it('renders a div element', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot />
      </Wrapper>
    );
    const el = container.querySelector('div > div');

    expect(el).toBeTruthy();
    expect(el?.tagName).toBe('DIV');
  });

  it('forwards ref to the root element', () => {
    const { Wrapper } = createPlayerWrapper();
    const ref = createRef<HTMLDivElement>();

    render(
      <Wrapper>
        <TimeSliderRoot ref={ref} />
      </Wrapper>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads additional props', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot data-testid="time-slider" />
      </Wrapper>
    );

    expect(container.querySelector('[data-testid="time-slider"]')).toBeTruthy();
  });

  it('sets data-orientation to horizontal', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]');

    expect(el?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('sets slider CSS custom properties', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]') as HTMLElement;

    expect(el?.style.getPropertyValue('--media-slider-fill')).toBeTruthy();
    expect(el?.style.getPropertyValue('--media-slider-pointer')).toBeTruthy();
    expect(el?.style.getPropertyValue('--media-slider-buffer')).toBeTruthy();
  });

  it('disables the slider when the time range is unknown', () => {
    mockTimeState.duration = 0;
    mockBufferState.seekable = [];
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <SliderThumb data-testid="thumb" />
        </TimeSliderRoot>
      </Wrapper>
    );

    const root = container.querySelector('[data-disabled]');
    const thumb = container.querySelector('[data-testid="thumb"]');

    expect(root).toBeTruthy();
    expect(thumb?.getAttribute('aria-disabled')).toBe('true');
    expect(thumb?.getAttribute('aria-valuetext')).toBe('Media not loaded, unknown time.');
    expect(thumb?.getAttribute('tabindex')).toBe('-1');
  });

  it('stays interactive when the buffer feature is not composed', () => {
    mockNoBuffer.value = true;
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <SliderThumb data-testid="thumb" />
        </TimeSliderRoot>
      </Wrapper>
    );

    const root = container.querySelector('[data-disabled]');
    const thumb = container.querySelector('[data-testid="thumb"]');

    expect(root).toBeNull();
    expect(thumb?.getAttribute('aria-disabled')).toBeNull();
    expect(thumb?.getAttribute('tabindex')).toBe('0');

    act(() => capturedSliderOptions.current.onValueCommit?.(50));

    expect(mockTimeState.seek).toHaveBeenCalledWith(60);
  });
});

describe('TimeSlider compound', () => {
  it('provides collection state to chapter collection callbacks', () => {
    const className = vi.fn((_state: TimeSliderChaptersState) => 'chapters');
    const renderRoot = vi.fn((props: HTMLAttributes<HTMLElement>, state: TimeSliderChaptersState) => (
      <section {...props} data-count={state.chapters.length} />
    ));
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderChapters
            className={className}
            render={renderRoot}
            renderChapter={(props) => <div {...props} className="chapter" />}
          />
        </TimeSliderRoot>
      </Wrapper>
    );

    expect(className).toHaveBeenCalledWith(expect.objectContaining({ chapters: expect.any(Array) }));
    expect(className.mock.calls[0]?.[0].chapters).toHaveLength(3);
    expect(className.mock.calls[0]?.[0]).not.toHaveProperty('active');
    expect(renderRoot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ chapters: expect.any(Array) })
    );
    expect(container.querySelector('section.chapters')?.getAttribute('data-count')).toBe('3');
  });

  it('leaves chapter class names to the consumer', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <TimeSliderChapters
            className="chapters"
            renderChapter={(props, state) => (
              <div {...props} className={state.active ? 'chapter active' : 'chapter'}>
                <SliderTrack className="chapter-track">
                  <SliderBuffer className="chapter-buffer" />
                  <SliderFill className="chapter-fill" />
                </SliderTrack>
              </div>
            )}
          />
          <TimeSliderChapterTitle className="chapter-title" />
        </TimeSliderRoot>
      </Wrapper>
    );

    const chapters = container.querySelectorAll('.chapter');
    const collection = container.querySelector('.chapters');

    expect(chapters).toHaveLength(3);
    expect(collection?.getAttribute('data-orientation')).toBe('horizontal');
    expect(chapters[0]?.getAttribute('data-orientation')).toBe('horizontal');
    expect(chapters[0]?.hasAttribute('data-active')).toBe(true);
    expect(chapters[0]?.matches(':first-child')).toBe(true);
    expect(chapters[2]?.matches(':last-child')).toBe(true);
    expect(chapters[0]?.classList).toContain('active');
    expect((chapters[1] as HTMLElement).style.pointerEvents).toBe('none');
    expect(chapters[0]?.querySelector('.chapter-track')).toBeTruthy();
    expect(chapters[0]?.querySelector('.chapter-buffer')).toBeTruthy();
    expect(chapters[0]?.querySelector('.chapter-fill')).toBeTruthy();
    expect((chapters[0] as HTMLElement).style.getPropertyValue('--media-slider-chapter-start')).toBe('0%');
    expect((chapters[0] as HTMLElement).style.getPropertyValue('--media-slider-chapter-end')).toBe(
      `${(40 / 120) * 100}%`
    );
    expect((chapters[0] as HTMLElement).style.getPropertyValue('--media-slider-chapter-width')).toBe(
      `${(40 / 120) * 100}%`
    );
    expect((chapters[0] as HTMLElement).style.getPropertyValue('--media-slider-chapter-fill')).toBe('75%');
    expect((chapters[0] as HTMLElement).style.getPropertyValue('--media-slider-chapter-buffer')).toBe('100%');
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('.chapter-title')?.textContent).toBe('First');
  });

  it('renders one full-range chapter when chapter cues are unavailable', () => {
    const cues = mockTextTrackState.chaptersCues;

    mockTextTrackState.chaptersCues = [];

    try {
      const { Wrapper } = createPlayerWrapper();
      const { container } = render(
        <Wrapper>
          <TimeSliderRoot>
            <TimeSliderChapters
              className="chapters"
              renderChapter={(props, state) => <div {...props} className="chapter" data-has-cue={state.cue !== null} />}
            />
          </TimeSliderRoot>
        </Wrapper>
      );

      expect(container.querySelector('.chapters')).toBeTruthy();
      const chapter = container.querySelector('.chapter') as HTMLElement;

      expect(chapter).toBeTruthy();
      expect(chapter.dataset.hasCue).toBe('false');
      expect(chapter.style.getPropertyValue('--media-slider-chapter-start')).toBe('0%');
      expect(chapter.style.getPropertyValue('--media-slider-chapter-end')).toBe('100%');
      expect(chapter.style.getPropertyValue('--media-slider-chapter-width')).toBe('100%');
    } finally {
      mockTextTrackState.chaptersCues = cues;
    }
  });

  it('uses the real duration for chapter geometry under one second', () => {
    const duration = mockTimeState.duration;
    const currentTime = mockTimeState.currentTime;
    const cues = mockTextTrackState.chaptersCues;

    mockTimeState.duration = 0.5;
    mockTimeState.currentTime = 0.25;
    mockTextTrackState.chaptersCues = [{ id: 'short', startTime: 0, endTime: 0.5, text: 'Short' }];

    try {
      const { Wrapper } = createPlayerWrapper();
      const { container } = render(
        <Wrapper>
          <TimeSliderRoot>
            <TimeSliderChapters renderChapter={(props) => <div {...props} className="chapter" />} />
          </TimeSliderRoot>
        </Wrapper>
      );

      const chapter = container.querySelector('.chapter') as HTMLElement;

      expect(chapter.style.getPropertyValue('--media-slider-chapter-end')).toBe('100%');
      expect(chapter.style.getPropertyValue('--media-slider-chapter-width')).toBe('100%');
    } finally {
      mockTimeState.duration = duration;
      mockTimeState.currentTime = currentTime;
      mockTextTrackState.chaptersCues = cues;
    }
  });

  it('keeps the final chapter at the exact right edge', () => {
    const duration = mockTimeState.duration;
    const cues = mockTextTrackState.chaptersCues;

    mockTimeState.duration = 487.626;
    mockTextTrackState.chaptersCues = [
      { id: 'first', startTime: 0, endTime: 200, text: 'First' },
      { id: 'last', startTime: 200, endTime: 487.626, text: 'Last' },
    ];
    mockSliderInput.pointerPercent = 100;
    mockSliderInput.pointing = true;

    try {
      const { Wrapper } = createPlayerWrapper();
      const { container } = render(
        <Wrapper>
          <TimeSliderRoot>
            <TimeSliderChapterTitle className="chapter-title" />
          </TimeSliderRoot>
        </Wrapper>
      );

      expect(container.querySelector('.chapter-title')?.textContent).toBe('Last');
      expect(container.querySelector('.chapter-title')?.getAttribute('aria-hidden')).toBe('true');
      expect(container.querySelector('.chapter-title')?.hasAttribute('aria-live')).toBe(false);
    } finally {
      mockTimeState.duration = duration;
      mockTextTrackState.chaptersCues = cues;
    }
  });

  it('announces the current chapter while using the keyboard', () => {
    const currentTime = mockTimeState.currentTime;

    mockTimeState.currentTime = 70;
    mockSliderInput.focused = true;

    try {
      const { Wrapper } = createPlayerWrapper();
      const { container } = render(
        <Wrapper>
          <TimeSliderRoot>
            <TimeSliderChapterTitle className="chapter-title" />
          </TimeSliderRoot>
        </Wrapper>
      );
      const title = container.querySelector('.chapter-title');

      expect(title?.textContent).toBe('Second');
      expect(title?.hasAttribute('aria-hidden')).toBe(false);
      expect(title?.getAttribute('aria-live')).toBe('polite');
    } finally {
      mockTimeState.currentTime = currentTime;
    }
  });

  it('renders all parts together', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot data-testid="root">
          <SliderTrack data-testid="track">
            <SliderFill data-testid="fill" />
            <SliderBuffer data-testid="buffer" />
            <SliderThumb data-testid="thumb" />
          </SliderTrack>
          <SliderValue data-testid="value" />
        </TimeSliderRoot>
      </Wrapper>
    );

    expect(container.querySelector('[data-testid="root"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="track"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="fill"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="buffer"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="thumb"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="value"]')).toBeTruthy();
  });

  it('thumb receives ARIA attributes from TimeSliderCore', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <SliderThumb data-testid="thumb" />
        </TimeSliderRoot>
      </Wrapper>
    );

    const thumb = container.querySelector('[data-testid="thumb"]');

    expect(thumb?.getAttribute('role')).toBe('slider');
    expect(thumb?.getAttribute('aria-label')).toBe('Seek');
  });

  it('formats thumb valuetext with the active locale', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <I18nProvider locale="fr" translations={{ time: { position: '{current} sur {duration}' } }}>
          <TimeSliderRoot>
            <SliderThumb data-testid="thumb" />
          </TimeSliderRoot>
        </I18nProvider>
      </Wrapper>
    );

    const thumb = container.querySelector('[data-testid="thumb"]');

    expect(thumb?.getAttribute('aria-valuetext')).toBe(
      `${formatTimeAsPhrase(30, { locale: 'fr' })} sur ${formatTimeAsPhrase(120, { locale: 'fr' })}`
    );
  });

  it('SliderValue displays formatted time', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <SliderValue data-testid="value" />
        </TimeSliderRoot>
      </Wrapper>
    );

    const output = container.querySelector('[data-testid="value"]');

    expect(output?.textContent).toBeTruthy();
  });

  it('formats values using the seekable end when duration is unknown', () => {
    mockTimeState.duration = 0;
    mockBufferState.seekable = [[0, 3700]];
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <TimeSliderRoot>
          <SliderValue data-testid="value" />
        </TimeSliderRoot>
      </Wrapper>
    );

    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('0:00:30');
  });
});

describe('TimeSliderRoot pauseOnDrag', () => {
  it('does nothing when pauseOnDrag is false (default)', () => {
    mockPlaybackState.paused = false;
    mockPlaybackState.play.mockClear();
    mockPlaybackState.pause.mockClear();

    const { Wrapper } = createPlayerWrapper();

    render(
      <Wrapper>
        <TimeSliderRoot />
      </Wrapper>
    );

    capturedSliderOptions.current.onDragStart?.();
    expect(mockPlaybackState.pause).not.toHaveBeenCalled();

    capturedSliderOptions.current.onDragEnd?.();
    expect(mockPlaybackState.play).not.toHaveBeenCalled();
  });

  it('pauses on drag-start and resumes on drag-end when playing', () => {
    mockPlaybackState.paused = false;
    mockPlaybackState.play.mockClear();
    mockPlaybackState.pause.mockClear();

    const { Wrapper } = createPlayerWrapper();

    render(
      <Wrapper>
        <TimeSliderRoot pauseOnDrag />
      </Wrapper>
    );

    capturedSliderOptions.current.onDragStart?.();
    expect(mockPlaybackState.pause).toHaveBeenCalledTimes(1);

    capturedSliderOptions.current.onDragEnd?.();
    expect(mockPlaybackState.play).toHaveBeenCalledTimes(1);
  });

  it('does not resume on drag-end when player was already paused', () => {
    mockPlaybackState.paused = true;
    mockPlaybackState.play.mockClear();
    mockPlaybackState.pause.mockClear();

    const { Wrapper } = createPlayerWrapper();

    render(
      <Wrapper>
        <TimeSliderRoot pauseOnDrag />
      </Wrapper>
    );

    capturedSliderOptions.current.onDragStart?.();
    expect(mockPlaybackState.pause).not.toHaveBeenCalled();

    capturedSliderOptions.current.onDragEnd?.();
    expect(mockPlaybackState.play).not.toHaveBeenCalled();
  });

  it('forwards user-provided onDragStart and onDragEnd', () => {
    mockPlaybackState.paused = false;
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();

    const { Wrapper } = createPlayerWrapper();

    render(
      <Wrapper>
        <TimeSliderRoot pauseOnDrag onDragStart={onDragStart} onDragEnd={onDragEnd} />
      </Wrapper>
    );

    capturedSliderOptions.current.onDragStart?.();
    expect(onDragStart).toHaveBeenCalled();

    capturedSliderOptions.current.onDragEnd?.();
    expect(onDragEnd).toHaveBeenCalled();
  });

  it('resumes on drag-end even if pauseOnDrag is turned off mid-drag', () => {
    mockPlaybackState.paused = false;
    mockPlaybackState.play.mockClear();
    mockPlaybackState.pause.mockClear();

    const { Wrapper } = createPlayerWrapper();
    const { rerender } = render(
      <Wrapper>
        <TimeSliderRoot pauseOnDrag />
      </Wrapper>
    );

    capturedSliderOptions.current.onDragStart?.();
    expect(mockPlaybackState.pause).toHaveBeenCalledTimes(1);

    rerender(
      <Wrapper>
        <TimeSliderRoot pauseOnDrag={false} />
      </Wrapper>
    );

    capturedSliderOptions.current.onDragEnd?.();
    expect(mockPlaybackState.play).toHaveBeenCalledTimes(1);
  });

  it('resumes on unmount if a drag paused playback', () => {
    mockPlaybackState.paused = false;
    mockPlaybackState.play.mockClear();
    mockPlaybackState.pause.mockClear();

    const { Wrapper } = createPlayerWrapper();
    const { unmount } = render(
      <Wrapper>
        <TimeSliderRoot pauseOnDrag />
      </Wrapper>
    );

    capturedSliderOptions.current.onDragStart?.();
    expect(mockPlaybackState.pause).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockPlaybackState.play).toHaveBeenCalledTimes(1);
  });
});

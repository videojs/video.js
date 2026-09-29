import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { SliderFill } from '../../slider/fill';
import { SliderThumb } from '../../slider/thumb';
import { SliderTrack } from '../../slider/track';
import { SliderValue } from '../../slider/value';
import { VolumeSliderRoot } from '../root';

// --- Hoisted mock data (available inside vi.mock factories) ---

const { mockSliderApi, mockVolumeState, mutableVolume } = vi.hoisted(() => {
  const volumeState = {
    volume: 0.8,
    muted: false,
    volumeAvailability: 'available' as const,
    setVolume: vi.fn(),
    setMuted: vi.fn(),
  };

  return {
    mockSliderApi: () => ({
      input: {
        current: {
          pointerPercent: 0,
          dragPercent: 0,
          dragging: false,
          pointing: false,
          focused: false,
        },
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
    }),
    mockVolumeState: volumeState,
    // Mutable holder so tests can swap between null and available volume.
    mutableVolume: {
      current: volumeState as
        | (Omit<typeof volumeState, 'volumeAvailability'> & {
            volumeAvailability: 'available' | 'unavailable' | 'unsupported';
          })
        | null,
    },
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

    // Return the mutable volume state directly for volume selectors.
    const vol = mutableVolume.current;
    if (!vol) return undefined;

    try {
      const result = selector(vol);
      if (result !== undefined) return result;
    } catch {
      // fall through
    }

    return undefined;
  }),
}));

afterEach(() => {
  cleanup();
  mutableVolume.current = mockVolumeState;
  mockVolumeState.setVolume.mockClear();
  mockVolumeState.setMuted.mockClear();
});

// --- Tests ---

describe('VolumeSliderRoot', () => {
  it('renders a div element', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]');

    expect(el).toBeTruthy();
    expect(el?.tagName).toBe('DIV');
  });

  it('forwards ref', () => {
    const { Wrapper } = createPlayerWrapper();
    const ref = createRef<HTMLDivElement>();

    render(
      <Wrapper>
        <VolumeSliderRoot ref={ref} />
      </Wrapper>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads additional props', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot data-testid="vol-slider" />
      </Wrapper>
    );

    expect(container.querySelector('[data-testid="vol-slider"]')).toBeTruthy();
  });

  it('defaults orientation to horizontal', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]');

    expect(el?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('does not render when volume control is unavailable', () => {
    mutableVolume.current = { ...mockVolumeState, volumeAvailability: 'unsupported' };
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot data-testid="vol-slider" />
      </Wrapper>
    );

    expect(container.querySelector('[data-testid="vol-slider"]')).toBeNull();
  });

  it('sets slider CSS custom properties', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]') as HTMLElement;

    expect(el?.style.getPropertyValue('--media-slider-fill')).toBeTruthy();
    expect(el?.style.getPropertyValue('--media-slider-pointer')).toBeTruthy();
  });
});

describe('VolumeSlider compound', () => {
  it('renders all parts together', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot data-testid="root">
          <SliderTrack data-testid="track">
            <SliderFill data-testid="fill" />
            <SliderThumb data-testid="thumb" />
          </SliderTrack>
          <SliderValue data-testid="value" />
        </VolumeSliderRoot>
      </Wrapper>
    );

    expect(container.querySelector('[data-testid="root"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="track"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="fill"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="thumb"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="value"]')).toBeTruthy();
  });

  it('thumb receives ARIA attributes from VolumeSliderCore', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot>
          <SliderThumb data-testid="thumb" />
        </VolumeSliderRoot>
      </Wrapper>
    );

    const thumb = container.querySelector('[data-testid="thumb"]');

    expect(thumb?.getAttribute('role')).toBe('slider');
    expect(thumb?.getAttribute('aria-label')).toBe('Volume');
  });

  it('SliderValue formats as percentage', () => {
    const { Wrapper } = createPlayerWrapper();
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot>
          <SliderValue data-testid="value" />
        </VolumeSliderRoot>
      </Wrapper>
    );

    const output = container.querySelector('[data-testid="value"]');

    expect(output?.textContent).toContain('%');
  });
});

describe('VolumeSliderRoot wheel handling', () => {
  it('attaches a non-passive wheel listener on the root element', () => {
    // Capture the raw options before jsdom normalizes them.
    const capturedOptions: AddEventListenerOptions[] = [];
    const origAdd = HTMLDivElement.prototype.addEventListener;
    const addSpy = vi.fn(function (
      this: HTMLDivElement,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      if (type === 'wheel' && typeof options === 'object') {
        capturedOptions.push({ ...options });
      }

      return origAdd.call(this, type, listener, options as AddEventListenerOptions);
    });

    HTMLDivElement.prototype.addEventListener = addSpy as typeof origAdd;

    const { Wrapper } = createPlayerWrapper();

    render(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    HTMLDivElement.prototype.addEventListener = origAdd;

    expect(capturedOptions.length).toBeGreaterThanOrEqual(1);
    expect(capturedOptions.some((opts) => opts.passive === false)).toBe(true);
  });

  it('honors disabled prop changes after initial render', () => {
    const { Wrapper } = createPlayerWrapper();

    // Render with disabled=true, dispatch wheel — setVolume should not be called.
    const { container, rerender } = render(
      <Wrapper>
        <VolumeSliderRoot disabled />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]') as HTMLElement;

    expect(el).toBeTruthy();

    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
    expect(mockVolumeState.setVolume).not.toHaveBeenCalled();

    // Rerender with disabled=false, dispatch wheel — setVolume should be called.
    rerender(
      <Wrapper>
        <VolumeSliderRoot disabled={false} />
      </Wrapper>
    );

    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
    expect(mockVolumeState.setVolume).toHaveBeenCalled();
  });

  it('attaches wheel handling when volume appears after initial null', () => {
    // Start with no volume — component returns null.
    mutableVolume.current = null;

    const { Wrapper } = createPlayerWrapper();
    const { container, rerender } = render(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    // Should not render when volume is null.
    expect(container.querySelector('[data-orientation]')).toBeNull();

    // Simulate volume becoming available.
    mutableVolume.current = mockVolumeState;
    rerender(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]') as HTMLElement;

    expect(el).toBeTruthy();

    // Wheel on the newly mounted root should call setVolume.
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
    expect(mockVolumeState.setVolume).toHaveBeenCalled();
  });
});

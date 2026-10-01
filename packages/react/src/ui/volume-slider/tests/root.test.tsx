import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { flush } from '@videojs/store';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createSliderPlayerWrapper as createPlayerWrapper } from '../../slider/tests/support';
import { SliderThumb } from '../../slider/thumb';
import { SliderValue } from '../../slider/value';
import { VolumeSliderRoot } from '../root';

const mockVolumeState = {
  volume: 0.8,
  muted: false,
  volumeAvailability: 'available' as const,
  mutedAvailability: 'available' as const,
  setVolume: vi.fn(),
  setMuted: vi.fn(),
};

afterEach(() => {
  cleanup();
  mockVolumeState.setVolume.mockClear();
  mockVolumeState.setMuted.mockClear();
});

describe('VolumeSliderRoot', () => {
  it('renders a div element', () => {
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
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
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
    const ref = createRef<HTMLDivElement>();

    render(
      <Wrapper>
        <VolumeSliderRoot ref={ref} />
      </Wrapper>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads additional props', () => {
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot data-testid="vol-slider" />
      </Wrapper>
    );

    expect(container.querySelector('[data-testid="vol-slider"]')).toBeTruthy();
  });

  it('defaults orientation to horizontal', () => {
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]');

    expect(el?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('does not render when volume control is unavailable', () => {
    const { Wrapper } = createPlayerWrapper({ ...mockVolumeState, volumeAvailability: 'unsupported' });
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot data-testid="vol-slider" />
      </Wrapper>
    );

    expect(container.querySelector('[data-testid="vol-slider"]')).toBeNull();
  });

  it('sets slider CSS custom properties', () => {
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    const el = container.querySelector('[data-orientation]') as HTMLElement;

    expect(el?.style.getPropertyValue('--media-slider-fill')).toBe('80.000%');
    expect(el?.style.getPropertyValue('--media-slider-pointer')).toBe('0.000%');
  });

  it('commits the step-rounded volume displayed while dragging', () => {
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
    const { getByTestId, getByRole } = render(
      <Wrapper>
        <VolumeSliderRoot step={10} data-testid="root">
          <SliderThumb />
        </VolumeSliderRoot>
      </Wrapper>
    );

    const root = getByTestId('root');

    root.getBoundingClientRect = () => new DOMRect(0, 0, 100, 10);
    root.setPointerCapture = vi.fn();
    root.releasePointerCapture = vi.fn();

    const pointer = (type: string, clientX: number) => {
      const event = new MouseEvent(type, { clientX, clientY: 5, button: 0, buttons: 1, bubbles: true });

      Object.defineProperties(event, {
        pointerId: { value: 1 },
        pointerType: { value: 'mouse' },
      });
      fireEvent(root, event);
    };

    pointer('pointerdown', 20);
    pointer('pointermove', 37);
    act(() => flush());

    expect(getByRole('slider').getAttribute('aria-valuenow')).toBe('40');

    pointer('pointerup', 37);

    expect(mockVolumeState.setVolume).toHaveBeenLastCalledWith(0.4);
  });

  it.each([
    { wheelStep: 5, deltaY: 120, expectedVolume: 0.75 },
    { wheelStep: 5, deltaY: -120, expectedVolume: 0.85 },
    { wheelStep: 2, deltaY: 120, expectedVolume: 0.78 },
    { wheelStep: 2, deltaY: -120, expectedVolume: 0.82 },
  ])('uses wheelStep=$wheelStep independently of step for deltaY=$deltaY', ({ wheelStep, deltaY, expectedVolume }) => {
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
    const { getByTestId } = render(
      <Wrapper>
        <VolumeSliderRoot step={10} wheelStep={wheelStep} data-testid="root" />
      </Wrapper>
    );

    fireEvent.wheel(getByTestId('root'), { deltaY });

    expect(mockVolumeState.setVolume).toHaveBeenCalledExactlyOnceWith(expectedVolume);
  });
});

describe('VolumeSlider compound', () => {
  it('thumb receives ARIA attributes from VolumeSliderCore', () => {
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
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
    const { Wrapper } = createPlayerWrapper(mockVolumeState);
    const { container } = render(
      <Wrapper>
        <VolumeSliderRoot>
          <SliderValue data-testid="value" />
        </VolumeSliderRoot>
      </Wrapper>
    );

    const output = container.querySelector('[data-testid="value"]');

    expect(output?.textContent).toBe('80%');
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

    const { Wrapper } = createPlayerWrapper(mockVolumeState);

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
    const { Wrapper } = createPlayerWrapper(mockVolumeState);

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
    const { Wrapper, update } = createPlayerWrapper();
    const { container, rerender } = render(
      <Wrapper>
        <VolumeSliderRoot />
      </Wrapper>
    );

    // Should not render when volume is null.
    expect(container.querySelector('[data-orientation]')).toBeNull();

    // Simulate volume becoming available.
    update(mockVolumeState);
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

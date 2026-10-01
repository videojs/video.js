import { cleanup, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { SliderBuffer } from '../buffer';
import { SliderFill } from '../fill';
import { SliderRoot } from '../root';
import { SliderThumb } from '../thumb';
import { SliderTrack } from '../track';
import { SliderValue } from '../value';
import { createSliderPlayerWrapper as createPlayerWrapper, measureSlider, pointer } from './support';

afterEach(cleanup);

describe('SliderRoot', () => {
  it('renders a div element', () => {
    const { container } = render(<SliderRoot />);
    const el = container.firstElementChild;

    expect(el).toBeTruthy();
    expect(el?.tagName).toBe('DIV');
  });

  it('forwards ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();

    render(<SliderRoot ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads additional props onto the root element', () => {
    const { container } = render(<SliderRoot data-testid="slider" />);
    const el = container.firstElementChild;

    expect(el?.getAttribute('data-testid')).toBe('slider');
  });

  it('sets data-orientation attribute', () => {
    const { container, rerender } = render(<SliderRoot orientation="vertical" />);
    const root = container.firstElementChild;

    expect(root?.getAttribute('data-orientation')).toBe('vertical');
    rerender(<SliderRoot orientation="horizontal" />);
    expect(root?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('sets CSS custom properties as inline styles', () => {
    const { container } = render(<SliderRoot value={50} />);
    const el = container.firstElementChild as HTMLElement;

    expect(el.style.getPropertyValue('--media-slider-fill')).toBe('50.000%');
    expect(el.style.getPropertyValue('--media-slider-pointer')).toBe('0.000%');
  });

  it('holds a controls visibility lock for the duration of a press', () => {
    const releaseControlsLock = vi.fn();
    const requestControlsLock = vi.fn(() => releaseControlsLock);
    const { Wrapper } = createPlayerWrapper({
      userActive: true,
      controlsVisible: true,
      requestControlsLock,
      toggleControls: vi.fn(),
    });

    const { container } = render(<SliderRoot />, { wrapper: Wrapper });
    const root = container.firstElementChild as HTMLElement;

    measureSlider(root);

    pointer(root, 'pointerdown', 50);
    expect(requestControlsLock).toHaveBeenCalledTimes(1);
    expect(releaseControlsLock).not.toHaveBeenCalled();

    pointer(root, 'pointerup', 50, 0);
    pointer(root, 'lostpointercapture', 50, 0);
    expect(releaseControlsLock).toHaveBeenCalledTimes(1);
  });
});

describe('SliderTrack', () => {
  it('throws outside of SliderRoot', () => {
    expect(() => render(<SliderTrack />)).toThrow('Slider compound components must be used within a Slider.Root');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <SliderRoot>
        <SliderTrack ref={ref} />
      </SliderRoot>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('SliderFill', () => {
  it('throws outside of SliderRoot', () => {
    expect(() => render(<SliderFill />)).toThrow('Slider compound components must be used within a Slider.Root');
  });
});

describe('SliderBuffer', () => {
  it('throws outside of SliderRoot', () => {
    expect(() => render(<SliderBuffer />)).toThrow('Slider compound components must be used within a Slider.Root');
  });
});

describe('SliderThumb', () => {
  it('throws outside of SliderRoot', () => {
    expect(() => render(<SliderThumb />)).toThrow('Slider compound components must be used within a Slider.Root');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <SliderRoot>
        <SliderThumb ref={ref} />
      </SliderRoot>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies ARIA attributes from core', () => {
    const { container } = render(
      <SliderRoot>
        <SliderThumb data-testid="thumb" />
      </SliderRoot>
    );

    const thumb = container.querySelector('[data-testid="thumb"]');

    expect(thumb?.getAttribute('role')).toBe('slider');
  });

  it('handles keydown before native ancestor listeners', () => {
    const { container } = render(
      <SliderRoot>
        <SliderThumb data-testid="thumb" />
      </SliderRoot>
    );
    const root = container.firstElementChild!;
    const thumb = container.querySelector('[data-testid="thumb"]')!;
    const onKeyDown = vi.fn((event: Event) => event.defaultPrevented);

    root.addEventListener('keydown', onKeyDown);
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });

    expect(onKeyDown).toHaveReturnedWith(true);
  });
});

describe('SliderValue', () => {
  it('renders an output element', () => {
    const { container } = render(
      <SliderRoot>
        <SliderValue data-testid="value" />
      </SliderRoot>
    );

    const el = container.querySelector('[data-testid="value"]');

    expect(el?.tagName).toBe('OUTPUT');
  });

  it('throws outside of SliderRoot', () => {
    expect(() => render(<SliderValue />)).toThrow('Slider compound components must be used within a Slider.Root');
  });

  it('displays rounded value by default', () => {
    const { container } = render(
      <SliderRoot value={42.6}>
        <SliderValue />
      </SliderRoot>
    );

    const output = container.querySelector('output');

    expect(output?.textContent).toBe('43');
  });

  it('accepts a custom format function', () => {
    const format = (v: number) => `${v}%`;
    const { container } = render(
      <SliderRoot value={75}>
        <SliderValue format={format} />
      </SliderRoot>
    );

    const output = container.querySelector('output');

    expect(output?.textContent).toBe('75%');
  });

  it('sets aria-live to off', () => {
    const { container } = render(
      <SliderRoot>
        <SliderValue />
      </SliderRoot>
    );

    const output = container.querySelector('output');

    expect(output?.getAttribute('aria-live')).toBe('off');
  });
});

describe('thumbAlignment', () => {
  it('does not adjust CSS vars for center alignment (default)', () => {
    const { container, rerender } = render(
      <SliderRoot value={10}>
        <SliderThumb />
      </SliderRoot>
    );
    const root = container.firstElementChild as HTMLElement;
    const thumb = root.querySelector('[role="slider"]') as HTMLElement;

    Object.defineProperty(root, 'offsetWidth', { value: 200 });
    Object.defineProperty(thumb, 'offsetWidth', { value: 20 });

    rerender(
      <SliderRoot value={10}>
        <SliderThumb />
      </SliderRoot>
    );
    expect(root.style.getPropertyValue('--media-slider-fill')).toBe('10.000%');
  });

  it('adjusts CSS vars for edge alignment', () => {
    const { container, rerender } = render(
      <SliderRoot value={0} thumbAlignment="edge">
        <SliderThumb />
      </SliderRoot>
    );

    const root = container.firstElementChild as HTMLElement;
    const thumb = root.querySelector('[role="slider"]') as HTMLElement;

    // Mock DOM measurements (jsdom reports 0 for all dimensions).
    Object.defineProperty(root, 'offsetWidth', { value: 200, configurable: true });
    Object.defineProperty(thumb, 'offsetWidth', { value: 20, configurable: true });

    // Re-render so the root reads the now-available element measurements.
    rerender(
      <SliderRoot value={0} thumbAlignment="edge">
        <SliderThumb />
      </SliderRoot>
    );

    // thumbHalf = (20/200 * 100) / 2 = 5%.  Adjusted 0% → 5%.
    expect(root.style.getPropertyValue('--media-slider-fill')).toBe('5.000%');
    measureSlider(root);
    pointer(root, 'pointermove', 40, 0);
    expect(root.style.getPropertyValue('--media-slider-pointer')).toBe('23.000%');
    pointer(root, 'pointermove', 80, 0);
    expect(root.style.getPropertyValue('--media-slider-pointer')).toBe('41.000%');
  });

  it('adjusts CSS vars at max value for edge alignment', () => {
    const { container, rerender } = render(
      <SliderRoot value={100} thumbAlignment="edge">
        <SliderThumb />
      </SliderRoot>
    );

    const root = container.firstElementChild as HTMLElement;
    const thumb = root.querySelector('[role="slider"]') as HTMLElement;

    Object.defineProperty(root, 'offsetWidth', { value: 200, configurable: true });
    Object.defineProperty(thumb, 'offsetWidth', { value: 20, configurable: true });

    rerender(
      <SliderRoot value={100} thumbAlignment="edge">
        <SliderThumb />
      </SliderRoot>
    );

    // thumbHalf = 5%.  Adjusted 100% → 95%.
    expect(root.style.getPropertyValue('--media-slider-fill')).toBe('95.000%');
  });
});

describe('Slider compound', () => {
  it('renders all parts together', () => {
    const { container } = render(
      <SliderRoot data-testid="root">
        <SliderTrack data-testid="track">
          <SliderFill data-testid="fill" />
          <SliderBuffer data-testid="buffer" />
          <SliderThumb data-testid="thumb" />
        </SliderTrack>
        <SliderValue data-testid="value" />
      </SliderRoot>
    );

    expect(container.querySelector('[data-testid="root"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="track"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="fill"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="buffer"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="thumb"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="value"]')).toBeTruthy();
  });
});

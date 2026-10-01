import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { SliderPreview } from '../preview';
import { SliderRoot } from '../root';
import { ResizeObserverStub } from './support';

beforeAll(() => vi.stubGlobal('ResizeObserver', ResizeObserverStub));
afterAll(() => vi.unstubAllGlobals());

afterEach(cleanup);

describe('SliderPreview', () => {
  it('renders a div element inside SliderRoot context', () => {
    const { container } = render(
      <SliderRoot data-testid="root">
        <SliderPreview data-testid="preview" />
      </SliderRoot>
    );

    const el = container.querySelector('[data-testid="preview"]');

    expect(container.querySelector('[data-testid="root"]')).toBeTruthy();
    expect(el).toBeTruthy();
    expect(el?.tagName).toBe('DIV');
  });

  it('throws outside of SliderRoot', () => {
    expect(() => render(<SliderPreview />)).toThrow('Slider compound components must be used within a Slider.Root');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <SliderRoot>
        <SliderPreview ref={ref} />
      </SliderRoot>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies clamped left style by default', () => {
    const { getByTestId, rerender } = render(
      <SliderRoot>
        <SliderPreview data-testid="preview" />
      </SliderRoot>
    );
    const preview = getByTestId('preview');

    ResizeObserverStub.measure(preview, 120);
    expect(preview.style.left).toBe('min(max(0px, calc(var(--media-slider-pointer) - 60px)), calc(100% - 120px))');
    rerender(
      <SliderRoot>
        <SliderPreview data-testid="preview" overflow="visible" />
      </SliderRoot>
    );
    expect(preview.style.left).toBe('calc(var(--media-slider-pointer) - 60px)');
  });

  it('applies unclamped left style when overflow is visible', () => {
    const { getByTestId, rerender } = render(
      <SliderRoot>
        <SliderPreview data-testid="preview" overflow="visible" />
      </SliderRoot>
    );
    const preview = getByTestId('preview');

    ResizeObserverStub.measure(preview, 120);
    expect(preview.style.left).toBe('calc(var(--media-slider-pointer) - 60px)');
    rerender(
      <SliderRoot>
        <SliderPreview data-testid="preview" overflow="clamp" />
      </SliderRoot>
    );
    expect(preview.style.left).toBe('min(max(0px, calc(var(--media-slider-pointer) - 60px)), calc(100% - 120px))');
  });

  it('propagates data attributes from slider state', () => {
    const { container } = render(
      <SliderRoot orientation="horizontal">
        <SliderPreview data-testid="preview" />
      </SliderRoot>
    );

    const el = container.querySelector('[data-testid="preview"]');

    expect(el?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('spreads additional props onto the element', () => {
    const { container } = render(
      <SliderRoot>
        <SliderPreview aria-label="Preview" />
      </SliderRoot>
    );

    const el = container.querySelector('[aria-label="Preview"]');

    expect(el).toBeTruthy();
  });

  it('renders children', () => {
    const { container } = render(
      <SliderRoot>
        <SliderPreview>
          <span data-testid="child">Preview content</span>
        </SliderPreview>
      </SliderRoot>
    );

    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
  });

  it('accepts className as a function of state', () => {
    const { container } = render(
      <SliderRoot>
        <SliderPreview data-testid="preview" className={(state) => (state.interactive ? 'active' : 'idle')} />
      </SliderRoot>
    );

    const el = container.querySelector('[data-testid="preview"]');

    expect(el?.className).toContain('idle');
  });

  it('accepts style as a function of state', () => {
    const { container } = render(
      <SliderRoot>
        <SliderPreview data-testid="preview" style={() => ({ opacity: 0.5 })} />
      </SliderRoot>
    );

    const el = container.querySelector('[data-testid="preview"]') as HTMLElement;

    expect(el.style.opacity).toBe('0.5');
    expect(el.style.position).toBe('absolute');
    expect(el.style.pointerEvents).toBe('none');
    expect(el.style.width).toBe('max-content');
  });
});

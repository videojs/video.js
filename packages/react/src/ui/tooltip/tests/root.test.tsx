import { cleanup, render, waitFor } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip, useOptionalTooltipContext } from '..';

const shortcutClassName = 'test-tooltip-shortcut';

function makeDOMRect(x: number, y: number, width: number, height: number): DOMRect {
  return new DOMRect(x, y, width, height);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function TooltipContent({ label, shortcut }: { label?: string; shortcut?: string }) {
  const tooltip = useOptionalTooltipContext();
  const setContent = tooltip?.setContent;

  useLayoutEffect(() => {
    setContent?.({ label, shortcut });
    return () => setContent?.(undefined);
  }, [setContent, label, shortcut]);

  return null;
}

describe('Tooltip', () => {
  it('exposes the positioned side on every part', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'trigger') return makeDOMRect(100, 10, 40, 20);

      if (this.dataset.testid === 'popup') return makeDOMRect(0, 0, 100, 60);

      return makeDOMRect(0, 0, 300, 200);
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.testid === 'popup' ? 100 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.testid === 'popup' ? 60 : 0;
    });

    const { container } = render(
      <Tooltip.Root defaultOpen side="top" boundary="viewport">
        <Tooltip.Trigger data-testid="trigger">Play</Tooltip.Trigger>
        <Tooltip.Popup data-testid="popup">
          <Tooltip.Label data-testid="label">Play</Tooltip.Label>
          <Tooltip.Shortcut data-testid="shortcut">K</Tooltip.Shortcut>
          <Tooltip.Arrow data-testid="arrow" />
        </Tooltip.Popup>
      </Tooltip.Root>
    );

    await waitFor(() => {
      for (const part of ['trigger', 'popup', 'label', 'shortcut', 'arrow']) {
        expect(container.querySelector(`[data-testid="${part}"]`)?.getAttribute('data-side')).toBe('bottom');
      }
    });
  });

  it('renders label and kbd shortcut from context', async () => {
    const { container } = render(
      <Tooltip.Root defaultOpen>
        <TooltipContent label="Play" shortcut="K" />
        <Tooltip.Popup data-testid="popup">
          <Tooltip.Label />
          <Tooltip.Shortcut className={shortcutClassName} />
        </Tooltip.Popup>
      </Tooltip.Root>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="popup"] span')?.textContent).toBe('Play');
      const hint = container.querySelector('[data-testid="popup"] kbd');

      expect(hint?.textContent).toBe('K');
      expect(hint?.localName).toBe('kbd');
    });
    expect(container.querySelector('[data-testid="popup"] span')?.getAttribute('class')).toBeNull();
  });

  it('omits shortcut without a shortcut value', async () => {
    const { container } = render(
      <Tooltip.Root defaultOpen>
        <TooltipContent label="Play" />
        <Tooltip.Popup data-testid="popup">
          <Tooltip.Label />
          <Tooltip.Shortcut className={shortcutClassName} />
        </Tooltip.Popup>
      </Tooltip.Root>
    );

    await waitFor(() => expect(container.querySelector('[data-testid="popup"] span')?.textContent).toBe('Play'));
    expect(container.querySelector('[data-testid="popup"] kbd')).toBeNull();
  });

  it('passes TooltipState to custom popup render functions', async () => {
    const { container } = render(
      <Tooltip.Root defaultOpen>
        <TooltipContent label="Play" shortcut="K" />
        <Tooltip.Popup
          render={(props, state) => (
            <div {...props} data-open={String(state.open)} data-side={state.side} data-testid="popup">
              <Tooltip.Label />
              <Tooltip.Shortcut className={shortcutClassName} />
            </div>
          )}
        />
      </Tooltip.Root>
    );

    await waitFor(() =>
      expect(container.querySelector('[data-testid="popup"]')?.getAttribute('data-open')).toBe('true')
    );
    expect(container.querySelector('[data-testid="popup"]')?.getAttribute('data-side')).toBe('top');
  });
});

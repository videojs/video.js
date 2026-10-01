import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import CollapsibleCode from '../CollapsibleCode';

// jsdom has no layout, so each test sets the content height the component measures.
let contentHeight = 0;

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => contentHeight);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderCode(props: Partial<Parameters<typeof CollapsibleCode>[0]> = {}) {
  return render(
    <div style={{ position: 'relative' }}>
      <CollapsibleCode {...props}>
        <pre data-testid="code">const x = 1;</pre>
      </CollapsibleCode>
    </div>
  );
}

describe('CollapsibleCode', () => {
  it('shows content that fits without controls', () => {
    contentHeight = 400;
    renderCode();

    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
    expect(screen.getByTestId('code').parentElement).not.toHaveStyle({ maxHeight: '512px' });
  });

  it('shows content only slightly over the cap in full', () => {
    contentHeight = 600;
    renderCode();

    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('collapses long content and expands it again', () => {
    contentHeight = 1200;
    renderCode();

    const content = screen.getByTestId('code').parentElement;

    expect(content).toHaveStyle({ maxHeight: '512px' });

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));

    expect(content).not.toHaveStyle({ maxHeight: '512px' });

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));

    expect(content).toHaveStyle({ maxHeight: '512px' });
  });

  it('measures hidden content once it is shown', () => {
    contentHeight = 1200;
    const { rerender } = renderCode({ active: false });

    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();

    rerender(
      <div style={{ position: 'relative' }}>
        <CollapsibleCode active>
          <pre data-testid="code">const x = 1;</pre>
        </CollapsibleCode>
      </div>
    );

    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });
});

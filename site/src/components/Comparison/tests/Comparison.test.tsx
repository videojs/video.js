import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import Comparison from '../Comparison';

afterEach(() => cleanup());

describe('Comparison', () => {
  it('compares text and images without a media player and preserves interactive content', () => {
    const { container } = render(
      <Comparison
        aspectRatio="2 / 1"
        items={[
          { label: 'Text', content: <p>The original text</p> },
          { label: 'Image', content: <img src="example.jpg" alt="An example" /> },
          { label: 'Action', content: <button>Try this</button> },
        ]}
      />
    );

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('.comparison-stage')).toHaveStyle({ aspectRatio: '2 / 1' });
    expect(container.querySelectorAll('.comparison-content')).toHaveLength(3);
    const divider = screen.getByRole('slider', { name: 'Text and Image divider' });

    expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(100 / 3);
    fireEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(screen.getByRole('button', { name: 'Try this' }).tabIndex).toBe(0);
    expect(container.querySelectorAll('.comparison-slice[inert]')).toHaveLength(2);
    fireEvent.doubleClick(divider);
    expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(100 / 3);
  });

  it('starts in compare all and keeps the selection when an image fails to load', () => {
    render(
      <Comparison
        items={[
          { label: 'Before', content: <img src="before.jpg" alt="Before image" /> },
          { label: 'After', content: <p>After text</p> },
        ]}
      />
    );
    const compare = screen.getByRole('button', { name: 'Compare all' });
    const before = screen.getByRole('button', { name: 'Before' });
    const divider = screen.getByRole('slider', { name: 'Before and After divider' });

    expect(compare).toHaveAttribute('aria-pressed', 'true');
    expect(before).toHaveAttribute('aria-pressed', 'false');
    fireEvent.error(screen.getByAltText('Before image'));
    expect(compare).toHaveAttribute('aria-pressed', 'true');
    expect(divider).toHaveAttribute('aria-valuenow', '50');

    fireEvent.click(screen.getByRole('button', { name: 'After' }));
    fireEvent.error(screen.getByAltText('Before image'));
    expect(screen.getByRole('button', { name: 'After' })).toHaveAttribute('aria-pressed', 'true');
    expect(divider).toHaveAttribute('aria-valuenow', '0');
  });

  it('uses one divider for a pair of items and pushes neighboring dividers for larger comparisons', () => {
    const { rerender } = render(
      <Comparison
        items={[
          { label: 'Before', content: <p>Before</p> },
          { label: 'After', content: <p>After</p> },
        ]}
      />
    );

    expect(screen.getAllByRole('slider', { name: /divider$/ })).toHaveLength(1);
    expect(screen.getByRole('slider', { name: 'Before and After divider' })).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Before and After divider' }), { key: 'End' });
    expect(screen.getByRole('slider', { name: 'Before and After divider' })).toHaveAttribute('aria-valuenow', '100');
    rerender(
      <Comparison
        items={[
          { label: 'A', content: <p>A</p> },
          { label: 'B', content: <p>B</p> },
          { label: 'C', content: <p>C</p> },
        ]}
      />
    );
    const sliders = screen.getAllByRole('slider', { name: /divider$/ });

    expect(Number(sliders[0]!.getAttribute('aria-valuenow'))).toBeCloseTo(100 / 3);
    expect(Number(sliders[1]!.getAttribute('aria-valuenow'))).toBeCloseTo(200 / 3);
    fireEvent.keyDown(sliders[0]!, { key: 'End' });

    for (const slider of sliders) expect(slider).toHaveAttribute('aria-valuenow', '100');
  });

  it('restores tab stops that change while their item is hidden', () => {
    function Roving({ first }: { first: boolean }) {
      return (
        <>
          <button tabIndex={first ? 0 : -1}>One</button>
          <button tabIndex={first ? -1 : 0}>Two</button>
        </>
      );
    }

    const items = (first: boolean) => [
      { label: 'Menu', content: <Roving first={first} /> },
      { label: 'Other', content: <p>Other</p> },
    ];
    const { rerender } = render(<Comparison items={items(true)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Other' }));
    rerender(<Comparison items={items(false)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('tabindex', '0');
  });

  it('exposes every visible item when the items contain no controls', () => {
    const { container } = render(
      <Comparison
        interactive={false}
        items={[
          { label: 'Before', content: <img src="before.jpg" alt="Before image" /> },
          { label: 'After', content: <img src="after.jpg" alt="After image" /> },
        ]}
      />
    );

    expect(container.querySelectorAll('.comparison-slice[aria-hidden]')).toHaveLength(0);
    expect(screen.getByAltText('Before image')).toBeVisible();
    expect(screen.getByAltText('After image')).toBeVisible();
  });
});

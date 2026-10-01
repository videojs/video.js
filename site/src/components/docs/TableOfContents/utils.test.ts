import { navigate } from 'astro:transitions/client';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  calculateActiveHeadingOffset,
  calculateRailGeometry,
  filterRenderedHeadings,
  navigateToHeading,
} from './utils';

vi.mock('astro:transitions/client', () => ({ navigate: vi.fn() }));

function createClientRects(...rects: DOMRect[]): DOMRectList {
  return Object.assign(rects, { item: (index: number) => rects[index] ?? null });
}

afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('navigateToHeading', () => {
  it('uses Astro navigation so the router owns the history entry', () => {
    const heading = document.createElement('h2');

    heading.id = 'installation';
    document.body.append(heading);

    navigateToHeading('installation');

    expect(navigate).toHaveBeenCalledWith('#installation');
  });

  it('does not navigate when the heading is absent', () => {
    navigateToHeading('missing');

    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('calculateActiveHeadingOffset', () => {
  it('combines document scroll padding with the heading scroll margin', () => {
    expect(calculateActiveHeadingOffset('96px', '20px')).toBe(116);
  });

  it('uses the available offset when the other value is not numeric', () => {
    expect(calculateActiveHeadingOffset('auto', '20px')).toBe(20);
  });

  it('falls back when neither offset is available', () => {
    expect(calculateActiveHeadingOffset('auto', '')).toBe(125);
  });
});

describe('calculateRailGeometry', () => {
  it('uses the default stripe height and gap when the rail fits', () => {
    expect(calculateRailGeometry(10, 100)).toEqual({ stripeHeight: 1, gap: 4 });
  });

  it('compresses gaps before changing stripe height', () => {
    expect(calculateRailGeometry(10, 28)).toEqual({ stripeHeight: 1, gap: 2 });
  });

  it('compresses stripe height when removing gaps is not enough', () => {
    expect(calculateRailGeometry(10, 5)).toEqual({ stripeHeight: 0.5, gap: 0 });
  });

  it('keeps the default geometry for a single stripe', () => {
    expect(calculateRailGeometry(1, 1)).toEqual({ stripeHeight: 1, gap: 4 });
  });
});

describe('filterRenderedHeadings', () => {
  it('omits conditional headings without a rendered target', () => {
    const headings = [
      { depth: 2, text: 'Choose your media', slug: 'choose-your-media' },
      { depth: 2, text: 'Install the media adapter', slug: 'install-the-media-adapter' },
      { depth: 2, text: 'Add your player', slug: 'add-your-player' },
    ];

    for (const heading of [headings[0], headings[2]]) {
      const element = document.createElement('h2');

      element.id = heading.slug;
      vi.spyOn(element, 'getClientRects').mockReturnValue(createClientRects(new DOMRect()));
      document.body.append(element);
    }

    expect(filterRenderedHeadings(headings)).toEqual([headings[0], headings[2]]);
  });

  it('omits static anchor placeholders for conditional headings', () => {
    const heading = { depth: 2, text: 'Install the media adapter', slug: 'install-the-media-adapter' };
    const placeholder = document.createElement('span');

    placeholder.id = heading.slug;
    placeholder.dataset.conditionalHeadingPlaceholder = '';
    vi.spyOn(placeholder, 'getClientRects').mockReturnValue(createClientRects(new DOMRect()));
    document.body.append(placeholder);

    expect(filterRenderedHeadings([heading])).toEqual([]);
  });

  it('omits headings hidden by a selected installation path', () => {
    const headings = [
      { depth: 2, text: 'Configure Shadcn', slug: 'configure-shadcn' },
      { depth: 2, text: 'Add your player', slug: 'add-your-player' },
    ];
    const hidden = document.createElement('h2');
    const visible = document.createElement('h2');

    hidden.id = headings[0].slug;
    visible.id = headings[1].slug;
    vi.spyOn(hidden, 'getClientRects').mockReturnValue(createClientRects());
    vi.spyOn(visible, 'getClientRects').mockReturnValue(createClientRects(new DOMRect()));
    document.body.append(hidden, visible);

    expect(filterRenderedHeadings(headings)).toEqual([headings[1]]);
  });
});

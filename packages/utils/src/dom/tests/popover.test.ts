import { describe, expect, it, vi } from 'vite-plus/test';

import { getPositionedSide, hideOpenPopovers } from '../popover';

function makeDOMRect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({}),
  };
}

describe('getPositionedSide', () => {
  const boundary = makeDOMRect(0, 0, 300, 200);
  const positioned = makeDOMRect(0, 0, 100, 60);
  const opts = { side: 'top' } as const;

  it('keeps the preferred side when it fits', () => {
    const trigger = makeDOMRect(100, 100, 40, 20);

    expect(getPositionedSide(trigger, positioned, boundary, opts)).toBe('top');
  });

  it('flips vertical sides when the opposite side fits better', () => {
    const topTrigger = makeDOMRect(100, 10, 40, 20);
    const bottomTrigger = makeDOMRect(100, 170, 40, 20);

    expect(getPositionedSide(topTrigger, positioned, boundary, opts)).toBe('bottom');
    expect(getPositionedSide(bottomTrigger, positioned, boundary, { side: 'bottom' })).toBe('top');
  });

  it('flips horizontal sides when the opposite side fits better', () => {
    const leftTrigger = makeDOMRect(10, 80, 40, 20);
    const rightTrigger = makeDOMRect(250, 80, 40, 20);

    expect(getPositionedSide(leftTrigger, positioned, boundary, { side: 'left' })).toBe('right');
    expect(getPositionedSide(rightTrigger, positioned, boundary, { side: 'right' })).toBe('left');
  });

  it('chooses the side with more space when neither side fits', () => {
    const smallBoundary = makeDOMRect(0, 0, 300, 100);
    const largePositioned = makeDOMRect(0, 0, 100, 80);
    const trigger = makeDOMRect(100, 30, 40, 10);

    expect(getPositionedSide(trigger, largePositioned, smallBoundary, opts)).toBe('bottom');
  });

  it('keeps the preferred side when neither side fits and available space is tied', () => {
    const smallBoundary = makeDOMRect(0, 0, 300, 100);
    const largePositioned = makeDOMRect(0, 0, 100, 80);
    const trigger = makeDOMRect(100, 45, 40, 10);

    expect(getPositionedSide(trigger, largePositioned, smallBoundary, opts)).toBe('top');
  });

  it('includes side and boundary offsets when checking available space', () => {
    const tallBoundary = makeDOMRect(0, 0, 300, 180);
    const trigger = makeDOMRect(100, 70, 40, 10);

    expect(getPositionedSide(trigger, positioned, tallBoundary, opts)).toBe('top');
    expect(
      getPositionedSide(trigger, positioned, tallBoundary, opts, {
        sideOffset: 8,
        boundaryOffset: 4,
      })
    ).toBe('bottom');
  });
});

describe('hideOpenPopovers', () => {
  function createPopover(open: boolean) {
    const el = document.createElement('div');
    const hidePopover = vi.fn();

    Object.defineProperty(el, 'hidePopover', { value: hidePopover });
    vi.spyOn(el, 'matches').mockImplementation((selector) => open && selector === ':popover-open');

    return { el, hidePopover };
  }

  it('hides open popovers in the light DOM and nested shadow roots', () => {
    const root = document.createElement('div');
    const shadowRoot = root.attachShadow({ mode: 'open' });
    const host = document.createElement('div');
    const nestedShadowRoot = host.attachShadow({ mode: 'open' });
    const light = createPopover(true);
    const shadow = createPopover(true);
    const nested = createPopover(true);

    root.append(light.el);
    shadowRoot.append(shadow.el, host);
    nestedShadowRoot.append(nested.el);

    hideOpenPopovers(root);

    expect(light.hidePopover).toHaveBeenCalledOnce();
    expect(shadow.hidePopover).toHaveBeenCalledOnce();
    expect(nested.hidePopover).toHaveBeenCalledOnce();
  });

  it('leaves closed popovers alone', () => {
    const root = document.createElement('div');
    const closed = createPopover(false);

    root.append(closed.el);

    hideOpenPopovers(root);

    expect(closed.hidePopover).not.toHaveBeenCalled();
  });
});

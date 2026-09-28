import { supportsPopoverAPI } from '@videojs/utils/dom';
import { describe, expect, it, vi } from 'vite-plus/test';

import { PopoverCSSVars } from '../../../../core/ui/popover/vars';
import {
  getAnchorPositionStyle,
  getFixedContainingBlockOrigin,
  getManualPositionStyle,
  getPopupPositionRect,
  getPositioningCSSVars,
  type PositioningOffsets,
  resolveOffsets,
} from '../positioning';

// Mock feature detection for deterministic tests.
vi.mock('@videojs/utils/dom', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;

  return {
    ...original,
    supportsAnchorPositioning: vi.fn(() => false),
    supportsPopoverAPI: vi.fn(() => false),
  };
});

function makeDOMRect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON() {},
  };
}

describe('getManualPositionStyle', () => {
  const trigger = makeDOMRect(100, 200, 120, 40);
  const popup = makeDOMRect(0, 0, 200, 80);

  it('positions above trigger for side=top', () => {
    const style = getManualPositionStyle(trigger, popup, { side: 'top', align: 'center' });

    expect(style.bottom).toBe('calc(100% - 200px + 0px)');
    expect(style.top).toBe('auto');
    // left = trigger.left + (trigger.width - popup.width)/2 = 100 + (120-200)/2 = 60
    expect(style.left).toBe('60px');
  });

  it('positions below trigger for side=bottom', () => {
    const style = getManualPositionStyle(trigger, popup, { side: 'bottom', align: 'center' });

    // top = trigger.bottom = 240
    expect(style.top).toBe('240px');
  });

  it('positions to the left of trigger for side=left', () => {
    const style = getManualPositionStyle(trigger, popup, { side: 'left', align: 'center' });

    expect(style.right).toBe('calc(100% - 100px + 0px)');
    expect(style.left).toBe('auto');
  });

  it('positions to the right of trigger for side=right', () => {
    const style = getManualPositionStyle(trigger, popup, { side: 'right', align: 'center' });

    // left = trigger.right = 220
    expect(style.left).toBe('220px');
  });

  it('positions top and left popups independently of their side-axis size', () => {
    const shortPopup = makeDOMRect(0, 0, popup.width, 20);
    const narrowPopup = makeDOMRect(0, 0, 20, popup.height);

    expect(getManualPositionStyle(trigger, shortPopup, { side: 'top', align: 'center' }).bottom).toBe(
      'calc(100% - 200px + 0px)'
    );
    expect(getManualPositionStyle(trigger, narrowPopup, { side: 'left', align: 'center' }).right).toBe(
      'calc(100% - 100px + 0px)'
    );
  });

  it('applies sideOffset from resolved CSS vars', () => {
    const offsets: PositioningOffsets = { sideOffset: 8, alignOffset: 0 };
    const style = getManualPositionStyle(trigger, popup, { side: 'top', align: 'center' }, offsets);

    expect(style.bottom).toBe('calc(100% - 200px + 8px)');
  });

  it('applies sideOffset for bottom side', () => {
    const offsets: PositioningOffsets = { sideOffset: 8, alignOffset: 0 };
    const style = getManualPositionStyle(trigger, popup, { side: 'bottom', align: 'center' }, offsets);

    // top = 240 + 8 = 248
    expect(style.top).toBe('248px');
  });

  it('aligns to start for horizontal sides', () => {
    const style = getManualPositionStyle(trigger, popup, { side: 'top', align: 'start' });

    // left = trigger.left = 100
    expect(style.left).toBe('100px');
  });

  it('aligns to end for horizontal sides', () => {
    const style = getManualPositionStyle(trigger, popup, { side: 'top', align: 'end' });

    // left = trigger.right - popup.width = 220 - 200 = 20
    expect(style.left).toBe('20px');
  });

  it('resolves horizontal start and end from RTL direction', () => {
    const start = getManualPositionStyle(trigger, popup, { side: 'top', align: 'start', direction: 'rtl' });
    const end = getManualPositionStyle(trigger, popup, { side: 'top', align: 'end', direction: 'rtl' });

    expect(start.left).toBe('20px');
    expect(end.left).toBe('100px');
  });

  it('applies alignOffset from resolved CSS vars', () => {
    const offsets: PositioningOffsets = { sideOffset: 0, alignOffset: 10 };
    const style = getManualPositionStyle(trigger, popup, { side: 'top', align: 'start' }, offsets);

    // left = trigger.left + alignOffset = 100 + 10 = 110
    expect(style.left).toBe('110px');
  });

  it('aligns vertically for left/right sides', () => {
    const style = getManualPositionStyle(trigger, popup, { side: 'right', align: 'start' });

    // top = trigger.top = 200
    expect(style.top).toBe('200px');
  });

  it('shifts top and bottom popups horizontally inside the boundary', () => {
    const boundary = makeDOMRect(0, 0, 300, 200);
    const rightEdgeTrigger = makeDOMRect(250, 100, 40, 20);
    const leftEdgeTrigger = makeDOMRect(10, 100, 40, 20);
    const edgePopup = makeDOMRect(0, 0, 100, 50);

    const topStyle = getManualPositionStyle(
      rightEdgeTrigger,
      edgePopup,
      { side: 'top', align: 'center' },
      undefined,
      boundary
    );
    const bottomStyle = getManualPositionStyle(
      leftEdgeTrigger,
      edgePopup,
      { side: 'bottom', align: 'center' },
      undefined,
      boundary
    );

    expect(topStyle.bottom).toBe('calc(100% - 100px + 0px)');
    expect(topStyle.left).toBe('200px');
    expect(bottomStyle.top).toBe('120px');
    expect(bottomStyle.left).toBe('0px');
  });

  it('shifts left and right popups vertically inside the boundary', () => {
    const boundary = makeDOMRect(0, 0, 300, 200);
    const bottomEdgeTrigger = makeDOMRect(100, 170, 40, 20);
    const topEdgeTrigger = makeDOMRect(100, 10, 40, 20);
    const edgePopup = makeDOMRect(0, 0, 80, 80);

    const rightStyle = getManualPositionStyle(
      bottomEdgeTrigger,
      edgePopup,
      { side: 'right', align: 'center' },
      undefined,
      boundary
    );
    const leftStyle = getManualPositionStyle(
      topEdgeTrigger,
      edgePopup,
      { side: 'left', align: 'center' },
      undefined,
      boundary
    );

    expect(rightStyle.top).toBe('120px');
    expect(rightStyle.left).toBe('140px');
    expect(leftStyle.top).toBe('0px');
    expect(leftStyle.right).toBe('calc(100% - 100px + 0px)');
  });

  it('respects boundary offset when shifting cross-axis overflow', () => {
    const boundary = makeDOMRect(0, 0, 300, 200);
    const edgeTrigger = makeDOMRect(250, 100, 40, 20);
    const edgePopup = makeDOMRect(0, 0, 100, 50);
    const offsets: PositioningOffsets = { sideOffset: 0, alignOffset: 0, boundaryOffset: 12 };

    const style = getManualPositionStyle(
      edgeTrigger,
      edgePopup,
      { side: 'bottom', align: 'center' },
      offsets,
      boundary
    );

    expect(style.bottom).toBe('auto');
    expect(style.top).toBe('120px');
    expect(style.left).toBe('188px');
  });

  it('does not shift side-axis overflow', () => {
    const boundary = makeDOMRect(0, 0, 300, 200);
    const edgeTrigger = makeDOMRect(100, 210, 40, 20);
    const edgePopup = makeDOMRect(0, 0, 80, 50);

    const style = getManualPositionStyle(
      edgeTrigger,
      edgePopup,
      { side: 'bottom', align: 'center' },
      undefined,
      boundary
    );

    expect(style.top).toBe('230px');
    expect(style.left).toBe('80px');
  });
});

describe('getPositioningCSSVars', () => {
  const boundary = makeDOMRect(0, 0, 300, 200);

  it('uses the boundary width for top and bottom popups', () => {
    const trigger = makeDOMRect(250, 150, 40, 20);
    const vars = getPositioningCSSVars(
      trigger,
      boundary,
      { side: 'bottom', align: 'center' },
      { sideOffset: 8, alignOffset: 0 }
    );

    expect(vars[PopoverCSSVars.availableHeight]).toBe('22px');
    expect(vars[PopoverCSSVars.availableWidth]).toBe('300px');
  });

  it.each(['start', 'center', 'end'] as const)('does not reduce cross-axis size for %s alignment', (align) => {
    const trigger = makeDOMRect(250, 150, 40, 20);
    const vars = getPositioningCSSVars(
      trigger,
      boundary,
      { side: 'bottom', align },
      { sideOffset: 0, alignOffset: 10 }
    );

    expect(vars[PopoverCSSVars.availableWidth]).toBe('300px');
  });

  it('uses the boundary height for left and right popups', () => {
    const trigger = makeDOMRect(120, 160, 40, 20);
    const vars = getPositioningCSSVars(
      trigger,
      boundary,
      { side: 'right', align: 'center' },
      { sideOffset: 12, alignOffset: 0 }
    );

    expect(vars[PopoverCSSVars.availableWidth]).toBe('128px');
    expect(vars[PopoverCSSVars.availableHeight]).toBe('200px');
  });

  it('subtracts boundary offset from side-axis and cross-axis sizes', () => {
    const trigger = makeDOMRect(250, 150, 40, 20);
    const vars = getPositioningCSSVars(
      trigger,
      boundary,
      { side: 'bottom', align: 'center' },
      { sideOffset: 8, alignOffset: 0, boundaryOffset: 10 }
    );

    expect(vars[PopoverCSSVars.availableHeight]).toBe('12px');
    expect(vars[PopoverCSSVars.availableWidth]).toBe('280px');
  });
});

describe('getAnchorPositionStyle', () => {
  it('returns empty object when anchor positioning unsupported and no rects', () => {
    const style = getAnchorPositionStyle('my-anchor', { side: 'top', align: 'center' });

    expect(style).toEqual({});
  });

  it('returns manual positioning when rects are provided and anchor unsupported', () => {
    const boundary = makeDOMRect(0, 0, 800, 600);
    const trigger = makeDOMRect(100, 200, 120, 40);
    const positioner = makeDOMRect(0, 0, 200, 80);

    const style = getAnchorPositionStyle('my-anchor', { side: 'top', align: 'center' }, trigger, positioner, boundary);

    expect(style.bottom).toBe('calc(100% - 200px + 0px)');
    expect(style.top).toBe('auto');
    expect(style.left).toBe('60px');
    expect(style.position).toBe('fixed');
    // Also includes sizing CSS vars
    expect(style[PopoverCSSVars.anchorWidth]).toBe('120px');
  });
});

describe('resolveOffsets', () => {
  it('resolves non-pixel CSS lengths to pixels', () => {
    const el = document.createElement('div');
    const getComputedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(
      (target: Element) =>
        ({
          fontSize: target === document.documentElement ? '16px' : '14px',
          getPropertyValue(name: string) {
            if (name === PopoverCSSVars.sideOffset) return '0.5rem';

            if (name === PopoverCSSVars.alignOffset) return '1em';

            if (name === PopoverCSSVars.boundaryOffset) return '2px';

            return '';
          },
        }) as CSSStyleDeclaration
    );

    expect(resolveOffsets(el)).toEqual({ sideOffset: 8, alignOffset: 14, boundaryOffset: 2 });

    getComputedStyleSpy.mockRestore();
  });
});

describe('getPopupPositionRect', () => {
  it('uses untransformed layout size when transforms change the client rect', () => {
    const el = document.createElement('div');

    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 80 });
    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => makeDOMRect(20, 40, 100, 40));

    const rect = getPopupPositionRect(el, 'top');

    expect(rect.left).toBe(20);
    expect(rect.top).toBe(40);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(80);
    expect(rect.right).toBe(220);
    expect(rect.bottom).toBe(120);
  });

  it('serializes adjusted rect values from toJSON', () => {
    const el = document.createElement('div');

    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 80 });
    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => makeDOMRect(20, 40, 100, 40));

    const rect = getPopupPositionRect(el, 'top');

    expect(rect.toJSON()).toEqual(
      expect.objectContaining({
        left: 20,
        top: 40,
        width: 200,
        height: 80,
        right: 220,
        bottom: 120,
      })
    );
  });

  it.each([
    ['top', 100, 80],
    ['left', 120, 60],
  ] as const)('includes overflow on the %s side axis', (side, expectedWidth, expectedHeight) => {
    const el = document.createElement('div');

    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => makeDOMRect(20, 40, 100, 60));
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 100 });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 60 });
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: 120 });
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 80 });

    const rect = getPopupPositionRect(el, side);

    expect(rect.width).toBe(expectedWidth);
    expect(rect.height).toBe(expectedHeight);
  });

  it('does not change available-size styles while measuring', () => {
    const el = document.createElement('div');

    el.style.setProperty(PopoverCSSVars.availableHeight, '20px');
    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => {
      expect(el.style.getPropertyValue(PopoverCSSVars.availableHeight)).toBe('20px');
      return makeDOMRect(20, 40, 100, 60);
    });
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 100 });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 20 });
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 60 });

    expect(getPopupPositionRect(el, 'top').height).toBe(60);
    expect(el.style.getPropertyValue(PopoverCSSVars.availableHeight)).toBe('20px');
  });
});

// Tests the CSS anchor positioning path via getAnchorPositionStyle with
// a fresh module import where supportsAnchorPositioning returns true.
describe('getAnchorPositionStyle (CSS Anchor Positioning)', () => {
  const SIDE_VAR = 'var(--media-popover-side-offset, 0px)';
  const ALIGN_VAR = 'var(--media-popover-align-offset, 0px)';

  async function importWithAnchorSupport() {
    vi.resetModules();
    vi.doMock('@videojs/utils/dom', async (importOriginal) => {
      const original = (await importOriginal()) as Record<string, unknown>;

      return { ...original, supportsAnchorPositioning: () => true };
    });
    const mod = await import('../positioning');

    return mod.getAnchorPositionStyle;
  }

  it('includes positionAnchor and position: fixed', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('my-popover', { side: 'top', align: 'center' });

    expect(style.positionAnchor).toBe('--my-popover');
    expect(style.position).toBe('fixed');
  });

  it('anchors the cross axis while shifting inside the boundary', async () => {
    const getStyle = await importWithAnchorSupport();
    const boundary = makeDOMRect(0, 0, 300, 200);
    const trigger = makeDOMRect(20, 100, 30, 20);
    const style = getStyle('my-popover', { side: 'top', align: 'center' }, trigger, undefined, boundary, {
      sideOffset: 0,
      alignOffset: 0,
      boundaryOffset: 8,
    });

    expect(style.positionAnchor).toBe('--my-popover');
    expect(style.bottom).toBe('calc(anchor(top) + var(--media-popover-side-offset, 0px))');
    expect(style.left).toBe('calc(anchor(center) + var(--media-popover-align-offset, 0px))');
    expect(style.translate).toBe('clamp(-27px, -50%, calc(257px - 100%)) 0');
  });

  it('anchors the vertical cross axis while shifting inside the boundary', async () => {
    const getStyle = await importWithAnchorSupport();
    const boundary = makeDOMRect(0, 0, 300, 200);
    const trigger = makeDOMRect(100, 20, 30, 40);
    const style = getStyle('my-popover', { side: 'left', align: 'end' }, trigger, undefined, boundary, {
      sideOffset: 0,
      alignOffset: 4,
      boundaryOffset: 8,
    });

    expect(style.right).toBe('calc(anchor(left) + var(--media-popover-side-offset, 0px))');
    expect(style.top).toBe('calc(anchor(bottom) + var(--media-popover-align-offset, 0px))');
    expect(style.translate).toBe('0 clamp(-56px, -100%, calc(128px - 100%))');
  });

  it('resolves horizontal start from RTL direction', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'top', align: 'start', direction: 'rtl' });

    expect(style.right).toBe(`calc(anchor(right) + ${ALIGN_VAR})`);
    expect(style.left).toBeUndefined();
  });

  it('places popover above trigger for side=top using CSS var offset', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'top', align: 'center' });

    expect(style.bottom).toBe(`calc(anchor(top) + ${SIDE_VAR})`);
    expect(style.top).toBeUndefined();
    expect(style.justifySelf).toBe('anchor-center');
    expect(style.marginInlineStart).toBe(ALIGN_VAR);
  });

  it('places popover below trigger for side=bottom', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'bottom', align: 'center' });

    expect(style.top).toBe(`calc(anchor(bottom) + ${SIDE_VAR})`);
    expect(style.bottom).toBeUndefined();
  });

  it('places popover to the left for side=left', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'left', align: 'center' });

    expect(style.right).toBe(`calc(anchor(left) + ${SIDE_VAR})`);
    expect(style.left).toBeUndefined();
  });

  it('places popover to the right for side=right', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'right', align: 'center' });

    expect(style.left).toBe(`calc(anchor(right) + ${SIDE_VAR})`);
    expect(style.right).toBeUndefined();
  });

  it('aligns to start with CSS var offset for top/bottom sides', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'top', align: 'start' });

    expect(style.left).toBe(`calc(anchor(left) + ${ALIGN_VAR})`);
    expect(style.right).toBeUndefined();
  });

  it('aligns to end with CSS var offset for top/bottom sides', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'bottom', align: 'end' });

    expect(style.right).toBe(`calc(anchor(right) + ${ALIGN_VAR})`);
    expect(style.left).toBeUndefined();
  });

  it('uses anchor-center and margin for center alignment', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'top', align: 'center' });

    expect(style.justifySelf).toBe('anchor-center');
    expect(style.marginInlineStart).toBe(ALIGN_VAR);
  });

  it('aligns vertically for left/right sides', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'left', align: 'start' });

    expect(style.top).toBe(`calc(anchor(top) + ${ALIGN_VAR})`);
  });

  it('uses alignSelf for center on left/right sides', async () => {
    const getStyle = await importWithAnchorSupport();
    const style = getStyle('a', { side: 'right', align: 'center' });

    expect(style.alignSelf).toBe('anchor-center');
    expect(style.marginBlockStart).toBe(ALIGN_VAR);
  });
});

describe('getFixedContainingBlockOrigin', () => {
  it('measures where a fixed box beside the popup lands, then removes the probe', () => {
    const parent = document.createElement('div');
    const popup = document.createElement('div');
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement
    ) {
      const left = this.style.position === 'fixed' ? 120 : 0;
      const top = this.style.position === 'fixed' ? 80 : 0;

      return {
        left,
        top,
        x: left,
        y: top,
        width: 0,
        height: 0,
        right: left,
        bottom: top,
        toJSON: () => ({}),
      } as DOMRect;
    });

    parent.append(popup);
    document.body.append(parent);

    expect(getFixedContainingBlockOrigin(popup)).toEqual({ x: 120, y: 80 });
    expect(parent.children).toHaveLength(1);

    measure.mockRestore();
    parent.remove();
  });

  it('uses the viewport for a closed `[popover]` popup when the Popover API exists', () => {
    const popup = document.createElement('div');
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');

    // The first position runs before `showPopover()` moves the popup to the top layer.
    vi.mocked(supportsPopoverAPI).mockReturnValueOnce(true);
    popup.setAttribute('popover', 'manual');
    document.body.append(popup);

    expect(getFixedContainingBlockOrigin(popup)).toEqual({ x: 0, y: 0 });
    expect(measure).not.toHaveBeenCalled();

    measure.mockRestore();
    popup.remove();
  });

  it('uses the viewport for a popup outside the document tree', () => {
    expect(getFixedContainingBlockOrigin(document.createElement('div'))).toEqual({ x: 0, y: 0 });
  });
});

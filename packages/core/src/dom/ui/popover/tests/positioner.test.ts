import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createDOMRect } from '../../../utils/layout';
import { PopupPositioner } from '../positioner';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockRect(element: Element, left: number, top: number, width: number, height: number): void {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(createDOMRect(left, top, width, height));
}

describe('PopupPositioner', () => {
  it('positions immediately and restores authored popup styles on cleanup', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const trigger = document.createElement('button');
    const popup = document.createElement('div');

    popup.style.position = 'absolute';
    popup.style.top = '12px';

    mockRect(document.documentElement, 0, 0, 800, 600);
    mockRect(trigger, 100, 200, 120, 40);
    mockRect(popup, 0, 0, 200, 80);
    Object.defineProperty(popup, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(popup, 'offsetHeight', { configurable: true, value: 80 });

    const positioner = new PopupPositioner();

    positioner.sync({
      anchorName: 'settings',
      position: { side: 'top', align: 'center' },
      trigger,
      popup,
    });

    expect(popup.style.position).toBe('fixed');
    expect(popup.style.top).toBe('auto');
    expect(popup.style.bottom).toBe('calc(100% - 200px)');
    expect(popup.style.left).toBe('60px');

    positioner.cleanup();

    expect(popup.style.position).toBe('absolute');
    expect(popup.style.top).toBe('12px');
    expect(popup.style.bottom).toBe('');
    expect(popup.style.left).toBe('');
  });

  it('resolves horizontal start from the trigger direction', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const trigger = document.createElement('button');
    const popup = document.createElement('div');

    trigger.dir = 'rtl';

    mockRect(document.documentElement, 0, 0, 800, 600);
    mockRect(trigger, 100, 200, 120, 40);
    mockRect(popup, 0, 0, 200, 80);
    Object.defineProperty(popup, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(popup, 'offsetHeight', { configurable: true, value: 80 });

    const positioner = new PopupPositioner();

    positioner.sync({
      anchorName: 'settings',
      position: { side: 'top', align: 'start' },
      trigger,
      popup,
    });

    expect(popup.style.left).toBe('20px');
    positioner.cleanup();
  });

  it('shares resize tracking and batches follow-up measurements', () => {
    let resize: (() => void) | undefined;
    const disconnect = vi.fn();
    const observe = vi.fn();

    class MockResizeObserver {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe = observe;
      disconnect = disconnect;
    }

    let frameCallback: FrameRequestCallback | undefined;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    });

    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const trigger = document.createElement('button');
    const popup = document.createElement('div');

    mockRect(document.documentElement, 0, 0, 800, 600);
    mockRect(trigger, 100, 200, 120, 40);
    mockRect(popup, 0, 0, 200, 80);
    Object.defineProperty(popup, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(popup, 'offsetHeight', { configurable: true, value: 80 });

    const onSideChange = vi.fn();
    const positioner = new PopupPositioner();

    positioner.sync({
      anchorName: 'settings',
      position: { side: 'top', align: 'center' },
      trigger,
      popup,
      onSideChange,
    });

    expect(onSideChange).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledTimes(2);

    resize?.();
    expect(requestFrame).toHaveBeenCalledTimes(1);
    frameCallback?.(0);
    expect(onSideChange).toHaveBeenCalledTimes(2);

    positioner.cleanup();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('can skip popup resize tracking', () => {
    const observe = vi.fn();

    class MockResizeObserver {
      observe = observe;
      disconnect = vi.fn();
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver);

    const trigger = document.createElement('button');
    const popup = document.createElement('div');

    mockRect(document.documentElement, 0, 0, 800, 600);
    mockRect(trigger, 100, 200, 120, 40);
    mockRect(popup, 0, 0, 200, 80);
    Object.defineProperty(popup, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(popup, 'offsetHeight', { configurable: true, value: 80 });

    const positioner = new PopupPositioner();

    positioner.sync({
      anchorName: 'settings',
      position: { side: 'top', align: 'center' },
      trigger,
      popup,
      trackResize: false,
    });

    expect(observe).toHaveBeenCalledOnce();
    expect(observe).toHaveBeenCalledWith(trigger);
  });

  it('remeasures when the position callback changes the popup size', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const trigger = document.createElement('button');
    const popup = document.createElement('div');
    let popupWidth = 200;

    mockRect(document.documentElement, 0, 0, 800, 600);
    mockRect(trigger, 100, 200, 120, 40);
    vi.spyOn(popup, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, popupWidth, 80));
    Object.defineProperty(popup, 'offsetWidth', { configurable: true, get: () => popupWidth });
    Object.defineProperty(popup, 'offsetHeight', { configurable: true, value: 80 });

    const onSideChange = vi.fn(() => {
      popupWidth = 100;
    });
    const positioner = new PopupPositioner();

    positioner.sync({
      anchorName: 'settings',
      position: { side: 'top', align: 'center' },
      trigger,
      popup,
      onSideChange,
    });

    expect(popup.style.left).toBe('110px');
    expect(onSideChange).toHaveBeenCalledOnce();
  });

  it('preserves consumer-authored and active popup anchor styles', async () => {
    vi.resetModules();
    vi.doMock('@videojs/utils/dom', async (importOriginal) => {
      const original = (await importOriginal()) as Record<string, unknown>;

      return { ...original, supportsAnchorPositioning: () => true };
    });
    const { PopupPositioner: AnchorPopupPositioner } = await import('../positioner');

    vi.stubGlobal('ResizeObserver', undefined);

    const trigger = document.createElement('button');
    const popup = document.createElement('div');
    const secondPopup = document.createElement('div');

    trigger.style.setProperty('anchor-name', '--consumer');
    popup.style.setProperty('position-anchor', '--consumer-popup');
    mockRect(document.documentElement, 0, 0, 800, 600);
    mockRect(trigger, 100, 200, 120, 40);

    const positioner = new AnchorPopupPositioner();

    positioner.sync({
      anchorName: 'settings',
      position: { side: 'top', align: 'center' },
      trigger,
      popup,
    });

    expect(trigger.style.getPropertyValue('anchor-name')).toBe('--consumer, --settings');
    expect(popup.style.getPropertyValue('position-anchor')).toBe('--settings');

    const secondPositioner = new AnchorPopupPositioner();

    secondPositioner.sync({
      anchorName: 'tooltip',
      position: { side: 'top', align: 'center' },
      trigger,
      popup: secondPopup,
    });

    expect(trigger.style.getPropertyValue('anchor-name')).toBe('--consumer, --settings, --tooltip');

    positioner.cleanup();

    expect(trigger.style.getPropertyValue('anchor-name')).toBe('--consumer, --tooltip');

    secondPositioner.cleanup();

    expect(trigger.style.getPropertyValue('anchor-name')).toBe('--consumer');
    expect(popup.style.getPropertyValue('position-anchor')).toBe('--consumer-popup');
  });

  it('falls back to manual coordinates under a transformed ancestor', () => {
    vi.stubGlobal('CSS', { supports: (condition: string) => condition === 'anchor-name: --a' });
    vi.stubGlobal('ResizeObserver', undefined);

    const wrapper = document.createElement('div');
    const trigger = document.createElement('button');
    const popup = document.createElement('div');

    wrapper.append(trigger, popup);
    document.body.append(wrapper);

    mockRect(document.documentElement, 0, 0, 800, 600);
    mockRect(trigger, 100, 200, 120, 40);
    mockRect(popup, 0, 0, 200, 80);
    Object.defineProperty(popup, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(popup, 'offsetHeight', { configurable: true, value: 80 });

    const positioner = new PopupPositioner();
    const options = {
      anchorName: 'settings',
      position: { side: 'top', align: 'center' },
      trigger,
      popup,
    } as const;

    positioner.sync(options);

    expect(popup.style.bottom).toBe('calc(anchor(top) + var(--media-popover-side-offset, 0px))');
    expect(popup.style.left).toBe('calc(anchor(center) + var(--media-popover-align-offset, 0px))');

    wrapper.style.transform = 'translate(-50%, -50%)';
    positioner.sync(options);

    expect(popup.style.bottom).toBe('calc(100% - 200px)');
    expect(popup.style.left).toBe('60px');
    expect(popup.style.translate).toBe('none');

    positioner.cleanup();
    wrapper.remove();
  });
});

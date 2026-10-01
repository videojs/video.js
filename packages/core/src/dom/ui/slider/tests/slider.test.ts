import { flush } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { SliderCore } from '../../../../core/ui/slider/core';
import { createSliderState } from '../../../tests/test-helpers';
import type { UIKeyboardEvent, UIPointerEvent } from '../../event';
import { createSlider, type SliderApi, type SliderOptions } from '../slider';

afterEach(() => {
  document.documentElement.removeAttribute('dir');
});

// --- Helpers ---

function createMockElement(rect: Partial<DOMRect> = {}): HTMLElement {
  const el = document.createElement('div');

  el.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 200,
    height: 20,
    top: 0,
    right: 200,
    bottom: 20,
    left: 0,
    toJSON() {},
    ...rect,
  });

  el.setPointerCapture = vi.fn();
  el.releasePointerCapture = vi.fn();

  return el;
}

function createOptions(overrides: Partial<SliderOptions> = {}): SliderOptions {
  return {
    getElement: () => createMockElement(),
    getOrientation: () => 'horizontal',
    isDisabled: () => false,
    getPercent: () => 50,
    getStepPercent: () => 1,
    getLargeStepPercent: () => 10,
    onValueChange: vi.fn(),
    onValueCommit: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    ...overrides,
  };
}

function pointerEvent(overrides: Partial<UIPointerEvent> = {}): UIPointerEvent {
  return {
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    pointerType: 'mouse',
    buttons: 1,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  };
}

function keyboardEvent(key: string, overrides: Partial<UIKeyboardEvent> = {}): UIKeyboardEvent {
  const node = document.createElement('div');

  return {
    key,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: node,
    currentTarget: node,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  };
}

/** Simulate a pointermove on the element (routed via pointer capture during drag). */
function firePointerMove(slider: SliderApi, overrides: Partial<UIPointerEvent> = {}): void {
  slider.rootProps.onPointerMove(pointerEvent(overrides));
}

/** Simulate a pointerup on the element (routed via pointer capture). */
function firePointerUp(slider: SliderApi, overrides: Partial<UIPointerEvent> = {}): void {
  slider.rootProps.onPointerUp(pointerEvent({ buttons: 0, ...overrides }));
}

/** Simulate lostpointercapture — fires after pointerup or pointercancel. */
function fireLostPointerCapture(slider: SliderApi): void {
  slider.rootProps.onLostPointerCapture();
}

// --- Tests ---

describe('createSlider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('adjustForAlignment', () => {
    it.each([
      ['horizontal', 5, 23],
      ['vertical', 10, 26],
    ] as const)('measures the %s axis for fill and pointer alignment', (orientation, fill, pointer) => {
      const root = createMockElement();
      const thumb = document.createElement('div');

      Object.defineProperties(root, { offsetWidth: { value: 200 }, offsetHeight: { value: 300 } });
      Object.defineProperties(thumb, { offsetWidth: { value: 20 }, offsetHeight: { value: 60 } });

      const core = new SliderCore({ thumbAlignment: 'edge', orientation });
      const slider = createSlider(
        createOptions({
          getElement: () => root,
          getThumbElement: () => thumb,
          adjustPercent: (percent, thumbSize, trackSize) =>
            core.adjustPercentForAlignment(percent, thumbSize, trackSize),
        })
      );
      const state = createSliderState({ orientation, thumbAlignment: 'edge', fillPercent: 0, pointerPercent: 20 });

      expect(slider.adjustForAlignment(state)).toMatchObject({ fillPercent: fill, pointerPercent: pointer });
      slider.destroy();
    });

    it.each(['center', 'no thumb', 'no adjustment'] as const)('preserves state with %s', (bypass) => {
      const root = createMockElement();
      const thumb = document.createElement('div');
      const adjustPercent = vi.fn(() => 99);
      const slider = createSlider(
        createOptions({
          getElement: () => root,
          getThumbElement: () => (bypass === 'no thumb' ? null : thumb),
          adjustPercent: bypass === 'no adjustment' ? undefined : adjustPercent,
        })
      );
      const state = createSliderState({
        thumbAlignment: bypass === 'center' ? 'center' : 'edge',
        fillPercent: 10,
        pointerPercent: 20,
      });

      expect(slider.adjustForAlignment(state)).toBe(state);
      expect(adjustPercent).not.toHaveBeenCalled();
      slider.destroy();
    });
  });

  it('notifies on root resize and disconnects the observer on destroy', () => {
    let callback: ResizeObserverCallback;
    const observe = vi.fn();
    const disconnect = vi.fn();

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          callback = cb;
        }
        observe = observe;
        disconnect = disconnect;
      }
    );

    const root = createMockElement();
    const onResize = vi.fn();
    const slider = createSlider(createOptions({ getElement: () => root, onResize }));

    expect(observe).toHaveBeenCalledExactlyOnceWith(root);
    // SAFETY: the resize callback ignores the observer and entries.
    callback!([], {} as ResizeObserver);
    expect(onResize).toHaveBeenCalledOnce();

    slider.destroy();
    expect(disconnect).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  describe('shape', () => {
    it('has correct initial state', () => {
      const slider = createSlider(createOptions());

      expect(slider.input.current).toEqual({
        pointerPercent: 0,
        dragPercent: 0,
        dragging: false,
        pointing: false,
        focused: false,
      });

      slider.destroy();
    });
  });

  describe('pointer: pointerdown', () => {
    it('sets pointing to true and computes percent from position', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 100 }));
      flush();

      expect(slider.input.current.pointing).toBe(true);
      expect(slider.input.current.pointerPercent).toBe(50);

      slider.destroy();
    });

    it('calls onValueChange with computed percent', () => {
      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueChange }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 100 }));

      expect(onValueChange).toHaveBeenCalledWith(50);

      slider.destroy();
    });

    it('sets pointer capture on element', () => {
      const el = createMockElement();
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ pointerId: 42 }));

      expect(el.setPointerCapture).toHaveBeenCalledWith(42);

      slider.destroy();
    });

    it('focuses thumb element when getThumbElement is provided', () => {
      const thumb = document.createElement('div');

      thumb.focus = vi.fn();

      const slider = createSlider(createOptions({ getThumbElement: () => thumb }));

      slider.rootProps.onPointerDown(pointerEvent());

      expect(thumb.focus).toHaveBeenCalled();

      slider.destroy();
    });

    it('calls preventDefault to suppress default focus behavior', () => {
      const slider = createSlider(createOptions());

      const event = pointerEvent();

      slider.rootProps.onPointerDown(event);

      expect(event.preventDefault).toHaveBeenCalled();

      slider.destroy();
    });

    it('does not call preventDefault when disabled', () => {
      const slider = createSlider(createOptions({ isDisabled: () => true }));

      const event = pointerEvent();

      slider.rootProps.onPointerDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();

      slider.destroy();
    });

    it('does nothing when disabled', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(createOptions({ isDisabled: () => true, onValueChange }));

      slider.rootProps.onPointerDown(pointerEvent());
      flush();

      expect(onValueChange).not.toHaveBeenCalled();
      expect(slider.input.current.pointing).toBe(false);

      slider.destroy();
    });
  });

  describe('pointer: drag', () => {
    it('starts drag after the pointer moves past the threshold', () => {
      const onDragStart = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onDragStart }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      flush();

      expect(slider.input.current.dragging).toBe(false);
      expect(onDragStart).not.toHaveBeenCalled();

      firePointerMove(slider, { clientX: 52 });
      flush();

      expect(slider.input.current.dragging).toBe(false);
      expect(onDragStart).not.toHaveBeenCalled();

      firePointerMove(slider, { clientX: 54 });
      flush();

      expect(slider.input.current.dragging).toBe(true);
      expect(onDragStart).toHaveBeenCalledOnce();

      slider.destroy();
    });

    it('brackets a stationary press with onPressStart and onPressEnd', () => {
      const onPressStart = vi.fn();
      const onPressEnd = vi.fn();
      const onDragStart = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(
        createOptions({
          getElement: () => el,
          onPressStart,
          onPressEnd,
          onDragStart,
        })
      );

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      flush();

      expect(onPressStart).toHaveBeenCalledOnce();
      expect(onDragStart).not.toHaveBeenCalled();
      expect(onPressEnd).not.toHaveBeenCalled();

      slider.rootProps.onPointerUp(pointerEvent({ clientX: 50 }));
      slider.rootProps.onLostPointerCapture();
      flush();

      expect(onPressEnd).toHaveBeenCalledOnce();
      expect(onDragStart).not.toHaveBeenCalled();

      slider.destroy();
    });

    it('calls onValueChange on every pointermove during drag', () => {
      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueChange }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      onValueChange.mockClear();

      firePointerMove(slider, { clientX: 60 });
      expect(onValueChange).toHaveBeenCalledTimes(1);

      firePointerMove(slider, { clientX: 80 });
      expect(onValueChange).toHaveBeenCalledTimes(2);

      firePointerMove(slider, { clientX: 100 });
      expect(onValueChange).toHaveBeenCalledTimes(3);

      slider.destroy();
    });

    it('updates dragPercent during drag', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 100 });
      flush();

      expect(slider.input.current.dragPercent).toBe(50);

      slider.destroy();
    });
  });

  describe('pointer: pointerup', () => {
    it('calls onValueCommit on pointerup and onDragEnd on lostpointercapture', () => {
      const onValueCommit = vi.fn();
      const onDragEnd = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueCommit, onDragEnd }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });

      // pointerup commits the value.
      firePointerUp(slider, { clientX: 100 });
      expect(onValueCommit).toHaveBeenCalledWith(50);

      // lostpointercapture cleans up drag state while preserving mouse hover.
      fireLostPointerCapture(slider);
      flush();

      expect(onDragEnd).toHaveBeenCalled();
      expect(slider.input.current.dragging).toBe(false);
      expect(slider.input.current.pointing).toBe(true);

      slider.destroy();
    });

    it('calls onValueCommit on pointerup even without drag', () => {
      const onValueCommit = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueCommit }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 100 }));
      firePointerUp(slider, { clientX: 100 });

      expect(onValueCommit).toHaveBeenCalledWith(50);

      slider.destroy();
    });

    it('clears pointing when the mouse is released outside the slider', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 100 }));
      firePointerUp(slider, { clientX: 250 });
      fireLostPointerCapture(slider);
      flush();

      expect(slider.input.current.pointing).toBe(false);

      slider.destroy();
    });

    it('clears pointing after a touch release', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 100, pointerType: 'touch' }));
      firePointerUp(slider, { clientX: 100, pointerType: 'touch' });
      fireLostPointerCapture(slider);
      flush();

      expect(slider.input.current.pointing).toBe(false);

      slider.destroy();
    });

    it('preserves mouse hover when a stale pointermove precedes lostpointercapture', () => {
      const onDragEnd = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onDragEnd }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerUp(slider, { clientX: 100 });
      firePointerMove(slider, { clientX: 100, buttons: 0 });
      fireLostPointerCapture(slider);
      flush();

      expect(slider.input.current.pointing).toBe(true);
      expect(onDragEnd).not.toHaveBeenCalled();

      slider.destroy();
    });
  });

  describe('pointer: lostpointercapture', () => {
    it('ends drag on lostpointercapture (e.g., after pointercancel)', () => {
      const onDragEnd = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onDragEnd }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });

      // Browser fires lostpointercapture after pointercancel or other capture loss.
      fireLostPointerCapture(slider);
      flush();

      expect(onDragEnd).toHaveBeenCalled();
      expect(slider.input.current.dragging).toBe(false);

      slider.destroy();
    });

    it('clears pointing without ending a drag after a click', () => {
      const onDragEnd = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onDragEnd }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      flush();
      expect(slider.input.current.dragging).toBe(false);
      expect(slider.input.current.pointing).toBe(true);

      fireLostPointerCapture(slider);
      flush();

      expect(slider.input.current.dragging).toBe(false);
      expect(slider.input.current.pointing).toBe(false);
      expect(onDragEnd).not.toHaveBeenCalled();

      slider.destroy();
    });
  });

  describe('pointer: stale drag safety', () => {
    it('ends drag when buttons is 0 for non-touch pointer', () => {
      const onDragEnd = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onDragEnd }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      flush();
      expect(slider.input.current.dragging).toBe(true);

      // Stale: buttons = 0, mouse pointer
      firePointerMove(slider, {
        clientX: 100,
        buttons: 0,
        pointerType: 'mouse',
      });
      flush();

      expect(slider.input.current.dragging).toBe(false);
      expect(onDragEnd).toHaveBeenCalled();

      slider.destroy();
    });

    it('does not end drag for touch pointer with buttons 0', () => {
      const onDragEnd = vi.fn();
      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onDragEnd, onValueChange }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      flush();
      expect(slider.input.current.dragging).toBe(true);

      // Touch with buttons=0 should NOT trigger stale drag detection
      firePointerMove(slider, {
        clientX: 100,
        buttons: 0,
        pointerType: 'touch',
      });
      flush();

      expect(slider.input.current.dragging).toBe(true);
      expect(onDragEnd).not.toHaveBeenCalled();

      slider.destroy();
    });
  });

  describe('pointer: hover (no drag)', () => {
    it('updates pointerPercent on hover', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerMove(pointerEvent({ clientX: 60 }));
      flush();

      expect(slider.input.current.pointing).toBe(true);
      expect(slider.input.current.pointerPercent).toBe(30);

      slider.destroy();
    });

    it('clears pointing on pointerleave and keeps last pointerPercent', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerMove(pointerEvent({ clientX: 60 }));
      slider.rootProps.onPointerLeave(pointerEvent());
      flush();

      expect(slider.input.current.pointing).toBe(false);
      expect(slider.input.current.pointerPercent).toBe(30);

      slider.destroy();
    });

    it('does not reset on pointerleave while pointer is captured', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      flush();
      expect(slider.input.current.dragging).toBe(true);

      // pointerleave is suppressed during capture; if it fires, it should be ignored.
      slider.rootProps.onPointerLeave(pointerEvent());
      flush();

      expect(slider.input.current.pointing).toBe(true);

      slider.destroy();
    });
  });

  describe('keyboard', () => {
    it('ArrowRight increments by step', () => {
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getStepPercent: () => 1,
          onValueChange,
          onValueCommit,
        })
      );

      const event = keyboardEvent('ArrowRight');

      slider.thumbProps.onKeyDownCapture(event);

      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(51);
      expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(51);
      expect(event.preventDefault).toHaveBeenCalled();

      slider.destroy();
    });

    it('ArrowLeft decrements by step', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getStepPercent: () => 1,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowLeft'));

      expect(onValueChange).toHaveBeenCalledWith(49);

      slider.destroy();
    });

    it('ArrowUp increments by step', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getStepPercent: () => 5,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowUp'));

      expect(onValueChange).toHaveBeenCalledWith(55);

      slider.destroy();
    });

    it('ArrowDown decrements by step', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getStepPercent: () => 5,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowDown'));

      expect(onValueChange).toHaveBeenCalledWith(45);

      slider.destroy();
    });

    it('Shift+Arrow uses large step', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getStepPercent: () => 1,
          getLargeStepPercent: () => 10,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight', { shiftKey: true }));

      expect(onValueChange).toHaveBeenCalledWith(60);

      slider.destroy();
    });

    it('PageUp increments by large step', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getLargeStepPercent: () => 10,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('PageUp'));

      expect(onValueChange).toHaveBeenCalledWith(60);

      slider.destroy();
    });

    it('PageDown decrements by large step', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getLargeStepPercent: () => 10,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('PageDown'));

      expect(onValueChange).toHaveBeenCalledWith(40);

      slider.destroy();
    });

    it('Home goes to 0%', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(createOptions({ onValueChange }));

      slider.thumbProps.onKeyDownCapture(keyboardEvent('Home'));

      expect(onValueChange).toHaveBeenCalledWith(0);

      slider.destroy();
    });

    it('End goes to 100%', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(createOptions({ onValueChange }));

      slider.thumbProps.onKeyDownCapture(keyboardEvent('End'));

      expect(onValueChange).toHaveBeenCalledWith(100);

      slider.destroy();
    });

    it('clamps to 0-100 range', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 99,
          getStepPercent: () => 5,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight'));

      expect(onValueChange).toHaveBeenCalledWith(100);

      slider.destroy();
    });

    it('steps from the last value while a key repeats', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 80,
          getStepPercent: () => 5,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight'));
      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight', { repeat: true }));
      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight', { repeat: true }));
      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight', { repeat: true }));
      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight', { repeat: true }));

      expect(onValueChange.mock.calls.map(([percent]) => percent)).toEqual([85, 90, 95, 100, 100]);

      slider.destroy();
    });

    it('steps from the latest pointer value while a key repeats', () => {
      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(
        createOptions({
          getElement: () => el,
          getPercent: () => 50,
          getStepPercent: () => 5,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight'));
      slider.rootProps.onPointerDown(pointerEvent({ clientX: 160 }));
      firePointerMove(slider, { clientX: 120 });
      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight', { repeat: true }));

      expect(onValueChange.mock.calls.map(([percent]) => percent)).toEqual([55, 80, 60, 65]);

      firePointerUp(slider, { clientX: 120 });
      slider.destroy();
    });

    it('does not preventDefault for unhandled keys', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(createOptions({ onValueChange }));

      const event = keyboardEvent('Tab');

      slider.thumbProps.onKeyDownCapture(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(onValueChange).not.toHaveBeenCalled();

      slider.destroy();
    });

    it('clears pointing when the keyboard takes over after a mouse release', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 100 }));
      firePointerUp(slider, { clientX: 100 });
      fireLostPointerCapture(slider);
      flush();
      expect(slider.input.current.pointing).toBe(true);

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight'));
      flush();

      expect(slider.input.current.pointing).toBe(false);

      slider.destroy();
    });

    it('rounds before stepping to prevent drift', () => {
      const onValueChange = vi.fn();
      // Simulate a value between steps (e.g., from a drag that landed at 47.3)
      const slider = createSlider(
        createOptions({
          getPercent: () => 47.3,
          getStepPercent: () => 5,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight'));

      // 47.3 rounds to 45 (nearest step of 5 from 0), then +5 = 50
      expect(onValueChange).toHaveBeenCalledWith(50);

      slider.destroy();
    });
  });

  describe('keyboard in an RTL document', () => {
    it('keeps ArrowRight increasing', () => {
      const onValueChange = vi.fn();

      document.documentElement.dir = 'rtl';
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getStepPercent: () => 1,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight'));

      expect(onValueChange).toHaveBeenCalledWith(51);

      slider.destroy();
    });

    it('keeps ArrowLeft decreasing', () => {
      const onValueChange = vi.fn();

      document.documentElement.dir = 'rtl';
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getStepPercent: () => 1,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowLeft'));

      expect(onValueChange).toHaveBeenCalledWith(49);

      slider.destroy();
    });

    it('keeps ArrowUp and ArrowDown unchanged', () => {
      const onValueChange = vi.fn();

      document.documentElement.dir = 'rtl';
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          getStepPercent: () => 1,
          onValueChange,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowUp'));
      expect(onValueChange).toHaveBeenCalledWith(51);

      onValueChange.mockClear();
      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowDown'));
      expect(onValueChange).toHaveBeenCalledWith(49);

      slider.destroy();
    });
  });

  describe('keyboard: disabled', () => {
    it('no-ops when disabled (except Tab)', () => {
      const onValueChange = vi.fn();
      const slider = createSlider(createOptions({ isDisabled: () => true, onValueChange }));

      const arrowEvent = keyboardEvent('ArrowRight');

      slider.thumbProps.onKeyDownCapture(arrowEvent);

      expect(onValueChange).not.toHaveBeenCalled();
      expect(arrowEvent.preventDefault).toHaveBeenCalled();

      slider.destroy();
    });

    it('does not preventDefault Tab when disabled', () => {
      const slider = createSlider(createOptions({ isDisabled: () => true }));

      const tabEvent = keyboardEvent('Tab');

      slider.thumbProps.onKeyDownCapture(tabEvent);

      expect(tabEvent.preventDefault).not.toHaveBeenCalled();

      slider.destroy();
    });
  });

  describe('focus', () => {
    it('sets focused true on focus', () => {
      const slider = createSlider(createOptions());

      slider.thumbProps.onFocus();
      flush();

      expect(slider.input.current.focused).toBe(true);

      slider.destroy();
    });

    it('sets focused false on blur', () => {
      const slider = createSlider(createOptions());

      slider.thumbProps.onFocus();
      slider.thumbProps.onBlur();
      flush();

      expect(slider.input.current.focused).toBe(false);

      slider.destroy();
    });
  });

  describe('orientation', () => {
    it('computes percent from Y axis for vertical orientation', () => {
      const el = createMockElement({ top: 0, height: 100 });
      const slider = createSlider(
        createOptions({
          getElement: () => el,
          getOrientation: () => 'vertical',
        })
      );

      // vertical: 0% at bottom (y=100), 100% at top (y=0)
      slider.rootProps.onPointerDown(pointerEvent({ clientY: 25 }));
      flush();

      expect(slider.input.current.pointerPercent).toBe(75);

      slider.destroy();
    });
  });

  describe('pointer in an RTL document', () => {
    it('keeps horizontal percent chronological', () => {
      const el = createMockElement({ left: 0, width: 200 });

      el.dir = 'rtl';
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      flush();

      expect(slider.input.current.pointerPercent).toBe(25);

      slider.destroy();
    });
  });

  describe('lifecycle', () => {
    it('releases pointer capture on destroy', () => {
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el }));

      slider.rootProps.onPointerDown(pointerEvent({ pointerId: 42, clientX: 50 }));
      slider.destroy();

      expect(el.releasePointerCapture).toHaveBeenCalledWith(42);
    });
  });

  describe('commit semantics', () => {
    it('does not fire onValueCommit during drag', () => {
      const onValueCommit = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueCommit }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      onValueCommit.mockClear();

      // Pass drag threshold and continue dragging
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      firePointerMove(slider, { clientX: 100 });

      // Commit must not fire during drag — only on release.
      expect(onValueCommit).not.toHaveBeenCalled();

      slider.destroy();
    });

    it('fires onValueChange on pointerup before onValueCommit', () => {
      const order: string[] = [];
      const onValueChange = vi.fn(() => order.push('change'));
      const onValueCommit = vi.fn(() => order.push('commit'));
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueChange, onValueCommit }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });

      onValueChange.mockClear();
      onValueCommit.mockClear();
      order.length = 0;

      firePointerUp(slider, { clientX: 100 });

      expect(onValueChange).toHaveBeenCalledWith(50);
      expect(onValueCommit).toHaveBeenCalledWith(50);
      expect(order).toEqual(['change', 'commit']);

      slider.destroy();
    });

    it('fires onValueCommit on stale drag exit with last drag percent', () => {
      const onValueCommit = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueCommit }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      onValueCommit.mockClear();

      // Stale drag: buttons = 0, mouse pointer
      firePointerMove(slider, {
        clientX: 100,
        buttons: 0,
        pointerType: 'mouse',
      });

      expect(onValueCommit).toHaveBeenCalledOnce();
      // Last drag percent was 40% (80/200) — the stale move doesn't update it.
      expect(onValueCommit).toHaveBeenCalledWith(40);

      slider.destroy();
    });

    it('fires onValueCommit on lostpointercapture without pointerup', () => {
      const onValueCommit = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueCommit }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      onValueCommit.mockClear();

      // Lost capture without pointerup (e.g., tab switch, pointercancel).
      fireLostPointerCapture(slider);

      expect(onValueCommit).toHaveBeenCalledOnce();
      expect(onValueCommit).toHaveBeenCalledWith(40);

      slider.destroy();
    });

    it('does not double-commit on pointerup followed by lostpointercapture', () => {
      const onValueCommit = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueCommit }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      onValueCommit.mockClear();

      // Normal flow: pointerup commits, then lostpointercapture cleans up.
      firePointerUp(slider, { clientX: 100 });
      fireLostPointerCapture(slider);

      // Only one commit from pointerup.
      expect(onValueCommit).toHaveBeenCalledOnce();
      expect(onValueCommit).toHaveBeenCalledWith(50);

      slider.destroy();
    });

    it('fires onValueCommit on lostpointercapture if pointerup was missed', () => {
      const onValueCommit = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(createOptions({ getElement: () => el, onValueCommit }));

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      onValueCommit.mockClear();

      // Lost capture without pointerup — endDrag fires commit as fallback.
      fireLostPointerCapture(slider);

      expect(onValueCommit).toHaveBeenCalledOnce();
      expect(onValueCommit).toHaveBeenCalledWith(25);

      slider.destroy();
    });
  });

  describe('changeThrottle', () => {
    it('fires onValueChange immediately on first drag move (leading edge)', () => {
      vi.useFakeTimers();

      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(
        createOptions({
          getElement: () => el,
          onValueChange,
          changeThrottle: 100,
        })
      );

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      onValueChange.mockClear();

      // First move fires immediately (leading edge).
      firePointerMove(slider, { clientX: 60 });

      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange).toHaveBeenCalledWith(30);

      // Second move during cooldown — throttled.
      firePointerMove(slider, { clientX: 80 });
      expect(onValueChange).toHaveBeenCalledOnce();

      slider.destroy();
      vi.useRealTimers();
    });

    it('coalesces rapid moves during cooldown to trailing edge', () => {
      vi.useFakeTimers();

      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(
        createOptions({
          getElement: () => el,
          onValueChange,
          changeThrottle: 100,
        })
      );

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      onValueChange.mockClear();

      // First move — leading fires.
      firePointerMove(slider, { clientX: 60 });
      expect(onValueChange).toHaveBeenCalledOnce();

      // More moves during cooldown.
      firePointerMove(slider, { clientX: 100 });
      firePointerMove(slider, { clientX: 120 });
      firePointerMove(slider, { clientX: 140 });

      // Still only the leading call.
      expect(onValueChange).toHaveBeenCalledOnce();

      // Trailing fires on cooldown expiry with latest value (140/200 = 70%).
      vi.advanceTimersByTime(100);
      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueChange).toHaveBeenLastCalledWith(70);

      slider.destroy();
      vi.useRealTimers();
    });

    it('does not throttle onValueChange when changeThrottle is 0', () => {
      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(
        createOptions({
          getElement: () => el,
          onValueChange,
          changeThrottle: 0,
        })
      );

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      onValueChange.mockClear();

      // Every drag move fires immediately.
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      firePointerMove(slider, { clientX: 100 });

      expect(onValueChange).toHaveBeenCalledTimes(3);

      slider.destroy();
    });

    it('cancels throttled change and fires unthrottled on pointerup', () => {
      vi.useFakeTimers();

      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(
        createOptions({
          getElement: () => el,
          onValueChange,
          changeThrottle: 100,
        })
      );

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      onValueChange.mockClear();

      // First move (leading fires) and more moves during cooldown.
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      firePointerMove(slider, { clientX: 120 });

      // Release before trailing fires.
      firePointerUp(slider, { clientX: 150 });

      // Leading + unthrottled pointerup. The coalesced moves were cancelled.
      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueChange).toHaveBeenLastCalledWith(75);

      // Advancing timer should NOT fire a stale trailing change.
      vi.advanceTimersByTime(200);
      expect(onValueChange).toHaveBeenCalledTimes(2);

      slider.destroy();
      vi.useRealTimers();
    });

    it('cancels throttle on destroy', () => {
      vi.useFakeTimers();

      const onValueChange = vi.fn();
      const el = createMockElement({ left: 0, width: 200 });
      const slider = createSlider(
        createOptions({
          getElement: () => el,
          onValueChange,
          changeThrottle: 100,
        })
      );

      slider.rootProps.onPointerDown(pointerEvent({ clientX: 50 }));
      onValueChange.mockClear();

      // First move (leading fires), more moves pending.
      firePointerMove(slider, { clientX: 60 });
      firePointerMove(slider, { clientX: 80 });
      firePointerMove(slider, { clientX: 120 });

      slider.destroy();

      // Advancing timer should NOT fire the pending trailing change.
      vi.advanceTimersByTime(200);
      expect(onValueChange).toHaveBeenCalledOnce();

      vi.useRealTimers();
    });

    it('does not throttle keyboard changes', () => {
      vi.useFakeTimers();

      const onValueChange = vi.fn();
      const slider = createSlider(
        createOptions({
          getPercent: () => 50,
          onValueChange,
          changeThrottle: 100,
        })
      );

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight'));

      slider.thumbProps.onKeyDownCapture(keyboardEvent('ArrowRight', { repeat: true }));

      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueChange).toHaveBeenLastCalledWith(52);
      expect(onValueChange).toHaveBeenCalledWith(51);

      slider.destroy();
      vi.useRealTimers();
    });
  });
});

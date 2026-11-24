import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { lockInteractions } from '../../ui/interaction-lock';
import { getGestureCoordinator } from '../coordinator';
import { createDoubleTapGesture, createTapGesture } from '../create-tap-gesture';

function setup() {
  const container = document.createElement('div');

  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 300,
    width: 300,
    top: 0,
    bottom: 200,
    height: 200,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  return container;
}

describe('GestureCoordinator', () => {
  it('exposes registered binding metadata until cleanup', () => {
    const container = setup();
    const coordinator = getGestureCoordinator(container);

    expect(coordinator.bindings).toEqual([]);

    const cleanup = createDoubleTapGesture(container, vi.fn(), { action: 'seekStep', region: 'left' });

    expect(coordinator.bindings).toEqual([
      expect.objectContaining({ type: 'doubletap', action: 'seekStep', region: 'left', value: -10 }),
    ]);

    cleanup();

    expect(coordinator.bindings).toEqual([]);
  });
});

describe('GestureCoordinator.subscribe', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires subscriber on tap', () => {
    const container = setup();
    const subscriber = vi.fn();

    getGestureCoordinator(container).subscribe(subscriber);
    createTapGesture(container, vi.fn(), { action: 'togglePaused' });

    pointerDown(container);
    vi.advanceTimersByTime(50);
    pointerUp(container, { pointerType: 'mouse', clientX: 150 });

    expect(subscriber).toHaveBeenCalledOnce();
    expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ type: 'tap', action: 'togglePaused' }));
  });

  it('fires subscriber on doubletap', () => {
    const container = setup();
    const subscriber = vi.fn();

    getGestureCoordinator(container).subscribe(subscriber);
    createDoubleTapGesture(container, vi.fn(), { action: 'seekStep', value: 10, region: 'right' });

    pointerDown(container);
    vi.advanceTimersByTime(50);
    pointerUp(container, { pointerType: 'mouse', clientX: 250 });

    vi.advanceTimersByTime(100);
    pointerDown(container);
    vi.advanceTimersByTime(50);
    pointerUp(container, { pointerType: 'mouse', clientX: 250 });

    expect(subscriber).toHaveBeenCalledOnce();
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doubletap', action: 'seekStep', value: 10, region: 'right' })
    );
  });

  it('includes pointer type in subscriber event', () => {
    const container = setup();
    const subscriber = vi.fn();

    getGestureCoordinator(container).subscribe(subscriber);
    createTapGesture(container, vi.fn(), { pointer: 'touch' });

    pointerDown(container);
    vi.advanceTimersByTime(50);
    pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ pointer: 'touch' }));
  });

  it('returns unsubscribe function that stops callbacks', () => {
    const container = setup();
    const subscriber = vi.fn();

    const unsubscribe = getGestureCoordinator(container).subscribe(subscriber);

    createTapGesture(container, vi.fn());

    unsubscribe();

    pointerDown(container);
    vi.advanceTimersByTime(50);
    pointerUp(container, { pointerType: 'mouse', clientX: 150 });

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('still invokes binding onActivate when a subscriber throws', () => {
    const container = setup();
    const bindingActivate = vi.fn();

    getGestureCoordinator(container).subscribe(() => {
      throw new Error('subscriber boom');
    });
    createTapGesture(container, bindingActivate, { action: 'togglePaused' });

    pointerDown(container);
    vi.advanceTimersByTime(50);
    pointerUp(container, { pointerType: 'mouse', clientX: 150 });

    expect(bindingActivate).toHaveBeenCalledOnce();
  });

  it('does not fire subscriber when gesture binding does not match', () => {
    const container = setup();
    const subscriber = vi.fn();

    getGestureCoordinator(container).subscribe(subscriber);
    createTapGesture(container, vi.fn(), { pointer: 'touch' });

    pointerDown(container);
    vi.advanceTimersByTime(50);
    // Fire with mouse, but binding is touch-only.
    pointerUp(container, { pointerType: 'mouse', clientX: 150 });

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('does not fire while container interactions are locked', () => {
    const container = setup();
    const subscriber = vi.fn();
    const release = lockInteractions(container);

    getGestureCoordinator(container).subscribe(subscriber);
    createTapGesture(container, vi.fn(), { action: 'togglePaused' });

    pointerDown(container);
    vi.advanceTimersByTime(50);
    pointerUp(container, { pointerType: 'mouse', clientX: 150 });

    expect(subscriber).not.toHaveBeenCalled();

    release();
  });
});

describe('GestureCoordinator touch click suppression', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('cancels the click for a touch tap claimed by a gesture', () => {
    const container = setup();
    const activate = vi.fn();

    createTapGesture(container, activate, { pointer: 'touch' });
    pointerDown(container);
    vi.advanceTimersByTime(50);
    pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(touchEnd(container).defaultPrevented).toBe(true);
    expect(activate).toHaveBeenCalledOnce();
  });

  it.each([
    { name: 'a different pointer type', pointerType: 'mouse', disabled: false, duration: 50 },
    { name: 'a disabled gesture', pointerType: 'touch', disabled: true, duration: 50 },
    { name: 'a long press', pointerType: 'touch', disabled: false, duration: 300 },
  ])('leaves touchend uncancelled for $name', ({ pointerType, disabled, duration }) => {
    const container = setup();

    createTapGesture(container, vi.fn(), { pointer: 'touch', disabled });
    pointerDown(container);
    vi.advanceTimersByTime(duration);
    pointerUp(container, { pointerType, clientX: 150 });

    expect(touchEnd(container).defaultPrevented).toBe(false);
  });

  it('leaves the next tap on an interactive control native', () => {
    const container = setup();
    const button = document.createElement('button');

    container.appendChild(button);
    createTapGesture(container, vi.fn(), { pointer: 'touch' });
    pointerDown(container);
    pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(touchEnd(container).defaultPrevented).toBe(true);

    pointerDown(button);
    pointerUp(button, { pointerType: 'touch', clientX: 150 });

    expect(touchEnd(button).defaultPrevented).toBe(false);
  });

  it('does not claim the touch when only a doubletap gesture is bound', () => {
    const container = setup();
    const doubletap = vi.fn();

    createDoubleTapGesture(container, doubletap, { pointer: 'touch' });
    pointerDown(container);
    pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(touchEnd(container).defaultPrevented).toBe(false);
  });

  it('leaves the lift of a non-primary touch native', () => {
    const container = setup();

    createTapGesture(container, vi.fn(), { pointer: 'touch' });
    pointerDown(container);
    pointerDown(container);
    pointerUp(container, { pointerType: 'touch', clientX: 150, isPrimary: false });

    expect(touchEvent(container, 'touchend', 1).defaultPrevented).toBe(false);
    expect(touchEnd(container).defaultPrevented).toBe(false);
  });

  it('does not cancel native panning after the browser cancels the pointer', () => {
    const container = setup();
    const activate = vi.fn();

    createTapGesture(container, activate, { pointer: 'touch' });
    pointerDown(container);
    container.dispatchEvent(new Event('pointercancel', { bubbles: true }));

    expect(touchEnd(container).defaultPrevented).toBe(false);
    expect(activate).not.toHaveBeenCalled();
  });
});

describe('GestureCoordinator.claimsTap', () => {
  it('claims a tap when a matching binding is registered', () => {
    const container = setup();

    createTapGesture(container, vi.fn(), { action: 'toggleControls', pointer: 'touch' });

    const event = pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(getGestureCoordinator(container).claimsTap(event, 'toggleControls')).toBe(true);
  });

  it('claims taps while container interactions are locked', () => {
    const container = setup();
    const release = lockInteractions(container);
    const event = pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(getGestureCoordinator(container).claimsTap(event, 'toggleControls')).toBe(true);

    release();
  });

  it('does not claim a tap on an interactive target', () => {
    const container = setup();
    const button = document.createElement('button');

    container.appendChild(button);
    createTapGesture(container, vi.fn(), { action: 'toggleControls', pointer: 'touch' });

    const event = pointerUp(button, { pointerType: 'touch', clientX: 150 });

    expect(getGestureCoordinator(container).claimsTap(event, 'toggleControls')).toBe(false);
  });

  it('does not claim when no binding matches the action', () => {
    const container = setup();

    createTapGesture(container, vi.fn(), { action: 'togglePaused', pointer: 'touch' });

    const event = pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(getGestureCoordinator(container).claimsTap(event, 'toggleControls')).toBe(false);
  });

  it('does not claim when the binding pointer does not match the event', () => {
    const container = setup();

    createTapGesture(container, vi.fn(), { action: 'toggleControls', pointer: 'mouse' });

    const event = pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(getGestureCoordinator(container).claimsTap(event, 'toggleControls')).toBe(false);
  });

  it('still claims when the binding is disabled', () => {
    const container = setup();

    createTapGesture(container, vi.fn(), { action: 'toggleControls', pointer: 'touch', disabled: true });

    const event = pointerUp(container, { pointerType: 'touch', clientX: 150 });

    expect(getGestureCoordinator(container).claimsTap(event, 'toggleControls')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pointerDown(target: HTMLElement, init: { button?: number } = {}): void {
  const event = new Event('pointerdown', { bubbles: true });

  Object.defineProperty(event, 'button', { value: init.button ?? 0 });
  target.dispatchEvent(event);
}

function touchEnd(target: HTMLElement): Event {
  return touchEvent(target, 'touchend');
}

function touchEvent(target: HTMLElement, type: string, activeTouches = 0): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperty(event, 'touches', { value: Array.from({ length: activeTouches }) });

  target.dispatchEvent(event);
  return event;
}

function pointerUp(
  target: HTMLElement,
  init: { pointerType: string; clientX: number; button?: number; isPrimary?: boolean }
): PointerEvent {
  const event = new PointerEvent('pointerup', {
    bubbles: true,
    pointerType: init.pointerType,
    clientX: init.clientX,
    button: init.button ?? 0,
  });

  // jsdom's PointerEvent does not implement `isPrimary`.
  Object.defineProperty(event, 'isPrimary', { value: init.isPrimary ?? true });

  target.dispatchEvent(event);
  return event;
}

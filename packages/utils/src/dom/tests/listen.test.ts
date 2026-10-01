import { describe, expect, it, vi } from 'vite-plus/test';

import { listen } from '../listen';

describe('listen', () => {
  it('adds an event listener', () => {
    const target = new EventTarget();
    const handler = vi.fn();

    listen(target, 'click', handler);
    target.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledOnce();
  });

  it('cleanup removes the listener', () => {
    const target = new EventTarget();
    const handler = vi.fn();

    const cleanup = listen(target, 'click', handler);

    cleanup();
    target.dispatchEvent(new Event('click'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('passes options to addEventListener', () => {
    const target = new EventTarget();
    const handler = vi.fn();

    listen(target, 'click', handler, { once: true });

    target.dispatchEvent(new Event('click'));
    target.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledOnce();
  });

  it('passes capture option correctly', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');

    parent.appendChild(child);

    const order: string[] = [];

    listen(parent, 'click', () => order.push('parent-capture'), { capture: true });
    listen(child, 'click', () => order.push('child'));
    listen(parent, 'click', () => order.push('parent-bubble'));

    child.dispatchEvent(new Event('click', { bubbles: true }));

    expect(order).toEqual(['parent-capture', 'child', 'parent-bubble']);
  });

  it('cleanup works with options', () => {
    const target = new EventTarget();
    const handler = vi.fn();

    const cleanup = listen(target, 'click', handler, { capture: true, passive: true });

    target.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledOnce();

    cleanup();
    target.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledOnce();
  });

  it('works with AbortSignal in options', () => {
    const target = new EventTarget();
    const handler = vi.fn();
    const controller = new AbortController();

    listen(target, 'click', handler, { signal: controller.signal });

    target.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledOnce();

    controller.abort();
    target.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('provides correct event type for typed targets', () => {
    const video = document.createElement('video');
    const handler = vi.fn((event: Event) => {
      expect(event.type).toBe('play');
    });

    listen(video, 'play', handler);
    video.dispatchEvent(new Event('play'));

    expect(handler).toHaveBeenCalledOnce();
  });

  it('works with Window', () => {
    const handler = vi.fn();
    const cleanup = listen(window, 'resize', handler);

    window.dispatchEvent(new Event('resize'));
    expect(handler).toHaveBeenCalledOnce();

    cleanup();
  });

  it('works with Document', () => {
    const handler = vi.fn();
    const cleanup = listen(document, 'visibilitychange', handler);

    document.dispatchEvent(new Event('visibilitychange'));
    expect(handler).toHaveBeenCalledOnce();

    cleanup();
  });
});

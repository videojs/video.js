import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { TooltipGroupCore } from '../group';

describe('TooltipGroupCore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes default delay and closeDelay', () => {
    const group = new TooltipGroupCore();

    expect(group.delay).toBe(600);
    expect(group.closeDelay).toBe(0);
  });

  it('accepts custom props', () => {
    const group = new TooltipGroupCore({ delay: 300, closeDelay: 100 });

    expect(group.delay).toBe(300);
    expect(group.closeDelay).toBe(100);
  });

  it('updates props via setProps', () => {
    const group = new TooltipGroupCore();

    group.setProps({ delay: 200, timeout: 500 });

    expect(group.delay).toBe(200);
  });

  it('should not skip delay initially', () => {
    const group = new TooltipGroupCore();

    expect(group.shouldSkipDelay()).toBe(false);
  });

  it('should skip delay after a tooltip closes', () => {
    const group = new TooltipGroupCore({ timeout: 400 });

    group.notifyOpen();
    group.notifyClose();

    expect(group.shouldSkipDelay()).toBe(true);
  });

  it('should not skip delay after timeout expires', () => {
    const group = new TooltipGroupCore({ timeout: 400 });

    group.notifyOpen();
    group.notifyClose();

    vi.advanceTimersByTime(400);

    expect(group.shouldSkipDelay()).toBe(false);
  });

  it('should skip delay when a tooltip is currently open', () => {
    const group = new TooltipGroupCore();

    group.notifyOpen();

    expect(group.shouldSkipDelay()).toBe(true);
  });

  it('respects updated timeout via setProps', () => {
    const group = new TooltipGroupCore({ timeout: 400 });

    group.notifyOpen();
    group.notifyClose();

    // Shrink timeout so we're already past it
    group.setProps({ timeout: 0 });

    expect(group.shouldSkipDelay()).toBe(false);
  });
});

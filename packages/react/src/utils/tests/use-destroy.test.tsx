import { act, render, renderHook } from '@testing-library/react';
import { Activity, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useDestroy } from '../use-destroy';

describe('useDestroy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not destroy synchronously in cleanup', () => {
    const instance = { destroy: vi.fn() };

    const { unmount } = renderHook(() => useDestroy(instance));

    unmount();

    // Destroy is deferred — not called yet
    expect(instance.destroy).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(instance.destroy).toHaveBeenCalledOnce();
  });

  it('destroys after real unmount in StrictMode', () => {
    const instance = { destroy: vi.fn() };

    function TestComponent() {
      useDestroy(instance);
      return null;
    }

    const { unmount } = render(
      <StrictMode>
        <TestComponent />
      </StrictMode>
    );

    vi.runAllTimers();
    expect(instance.destroy).not.toHaveBeenCalled();

    unmount();
    vi.runAllTimers();

    expect(instance.destroy).toHaveBeenCalledOnce();
  });

  it('calls setup once in StrictMode (skips re-mount)', () => {
    const instance = { destroy: vi.fn() };
    const setup = vi.fn();

    function TestComponent() {
      useDestroy(instance, setup);
      return null;
    }

    render(
      <StrictMode>
        <TestComponent />
      </StrictMode>
    );

    // Setup should only run once — the re-mount skips it
    expect(setup).toHaveBeenCalledOnce();
  });

  it('calls teardown before destroy on unmount', () => {
    const order: string[] = [];
    const instance = { destroy: vi.fn(() => order.push('destroy')) };
    const teardown = vi.fn(() => order.push('teardown'));

    const { unmount } = renderHook(() => useDestroy(instance, undefined, teardown));

    unmount();
    vi.runAllTimers();

    expect(teardown).toHaveBeenCalledOnce();
    expect(instance.destroy).toHaveBeenCalledOnce();
    expect(order).toEqual(['teardown', 'destroy']);
  });

  it('does not call teardown in StrictMode double-mount', () => {
    const instance = { destroy: vi.fn() };
    const teardown = vi.fn();

    function TestComponent() {
      useDestroy(instance, undefined, teardown);
      return null;
    }

    render(
      <StrictMode>
        <TestComponent />
      </StrictMode>
    );

    vi.runAllTimers();

    expect(teardown).not.toHaveBeenCalled();
    expect(instance.destroy).not.toHaveBeenCalled();
  });

  it('runs setup again when an Activity is shown after the deferred destroy fired', () => {
    const instance = { destroy: vi.fn() };
    const setup = vi.fn();
    const teardown = vi.fn();

    function TestComponent() {
      useDestroy(instance, setup, teardown);
      return null;
    }

    const { rerender } = render(
      <Activity mode="visible">
        <TestComponent />
      </Activity>
    );

    rerender(
      <Activity mode="hidden">
        <TestComponent />
      </Activity>
    );
    act(() => vi.runAllTimers());

    rerender(
      <Activity mode="visible">
        <TestComponent />
      </Activity>
    );

    expect(teardown).toHaveBeenCalledOnce();
    expect(instance.destroy).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenCalledTimes(2);
  });

  it('sets up a replacement for an instance destroyed while hidden', () => {
    const first = { destroy: vi.fn() };
    const second = { destroy: vi.fn() };
    const setup = vi.fn();

    function TestComponent({ instance }: { instance: { destroy(): void } }) {
      useDestroy(instance, () => setup(instance));
      return null;
    }

    const { rerender } = render(
      <Activity mode="visible">
        <TestComponent instance={first} />
      </Activity>
    );

    rerender(
      <Activity mode="hidden">
        <TestComponent instance={first} />
      </Activity>
    );
    act(() => vi.runAllTimers());

    rerender(
      <Activity mode="visible">
        <TestComponent instance={first} />
      </Activity>
    );
    rerender(
      <Activity mode="visible">
        <TestComponent instance={second} />
      </Activity>
    );
    act(() => vi.runAllTimers());

    expect(first.destroy).toHaveBeenCalledOnce();
    expect(second.destroy).not.toHaveBeenCalled();
    expect(setup.mock.calls).toEqual([[first], [first], [second]]);
  });
});

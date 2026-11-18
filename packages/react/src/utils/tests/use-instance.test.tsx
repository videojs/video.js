import { act, cleanup, render } from '@testing-library/react';
import { Activity, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useInstance } from '../use-instance';

class Resource {
  constructor(readonly label: string) {}

  destroy = vi.fn();
}

describe('useInstance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('replaces an instance destroyed while an Activity was hidden', () => {
    const setup = vi.fn();
    const teardown = vi.fn();
    let instance!: Resource;

    function TestComponent({ label }: { label: string }) {
      instance = useInstance(() => new Resource(label), { setup, teardown });
      return null;
    }

    function App({ mode, label }: { mode: 'visible' | 'hidden'; label: string }) {
      return (
        <Activity mode={mode}>
          <TestComponent label={label} />
        </Activity>
      );
    }

    const { rerender } = render(<App mode="visible" label="first" />);
    const original = instance;

    rerender(<App mode="hidden" label="second" />);
    act(() => vi.runAllTimers());
    rerender(<App mode="visible" label="second" />);

    expect(instance).not.toBe(original);
    expect(instance.label).toBe('second');
    expect(original.destroy).toHaveBeenCalledOnce();
    expect(instance.destroy).not.toHaveBeenCalled();
    expect(setup.mock.calls).toEqual([[original], [instance]]);
    expect(teardown.mock.calls).toEqual([[original]]);
  });

  it('keeps the instance when an Activity is shown before the deferred destroy fires', () => {
    let instance!: Resource;

    function TestComponent() {
      instance = useInstance(() => new Resource('only'));
      return null;
    }

    function App({ mode }: { mode: 'visible' | 'hidden' }) {
      return (
        <Activity mode={mode}>
          <TestComponent />
        </Activity>
      );
    }

    const { rerender } = render(<App mode="visible" />);
    const original = instance;

    rerender(<App mode="hidden" />);
    rerender(<App mode="visible" />);
    act(() => vi.runAllTimers());

    expect(instance).toBe(original);
    expect(original.destroy).not.toHaveBeenCalled();
  });

  it('keeps the instance and runs setup once in StrictMode', () => {
    const setup = vi.fn();
    let instance!: Resource;

    function TestComponent() {
      instance = useInstance(() => new Resource('only'), { setup });
      return null;
    }

    render(
      <StrictMode>
        <TestComponent />
      </StrictMode>
    );
    act(() => vi.runAllTimers());

    expect(setup).toHaveBeenCalledOnce();
    expect(instance.destroy).not.toHaveBeenCalled();
  });
});

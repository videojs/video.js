import { act, cleanup, render } from '@testing-library/react';
import type { Media } from '@videojs/media';
import { Activity, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useMedia } from '../../player/context';
import { createPlayer } from '../../player/create-player';
import { useMediaInstance } from '../use-media-instance';

class TestMedia extends EventTarget {
  destroy = vi.fn();
}

const MediaClass = TestMedia as unknown as new () => Media & TestMedia;

describe('useMediaInstance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('replaces the destroyed instance when an Activity is hidden and shown again', () => {
    const { Player } = createPlayer({ features: [] });

    let instance!: TestMedia;
    let attached!: Media | null;

    function TestComponent() {
      instance = useMediaInstance(MediaClass);
      attached = useMedia();
      return null;
    }

    function App({ mode }: { mode: 'visible' | 'hidden' }) {
      return (
        <Activity mode={mode}>
          <Player>
            <TestComponent />
          </Player>
        </Activity>
      );
    }

    const { rerender } = render(<App mode="visible" />);
    const original = instance;

    expect(attached).toBe(original);

    rerender(<App mode="hidden" />);
    act(() => vi.runAllTimers());

    expect(original.destroy).toHaveBeenCalledOnce();

    rerender(<App mode="visible" />);

    expect(instance).not.toBe(original);
    expect(instance.destroy).not.toHaveBeenCalled();
    expect(attached).toBe(instance);

    rerender(<App mode="hidden" />);
    act(() => vi.runAllTimers());

    expect(instance.destroy).toHaveBeenCalledOnce();
    expect(original.destroy).toHaveBeenCalledOnce();
  });

  it('keeps the same instance in StrictMode', () => {
    const { Player } = createPlayer({ features: [] });

    let instance!: TestMedia;
    let attached!: Media | null;

    function TestComponent() {
      instance = useMediaInstance(MediaClass);
      attached = useMedia();
      return null;
    }

    render(
      <StrictMode>
        <Player>
          <TestComponent />
        </Player>
      </StrictMode>
    );

    act(() => vi.runAllTimers());

    expect(attached).toBe(instance);
    expect(instance.destroy).not.toHaveBeenCalled();
  });
});

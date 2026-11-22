import { act, cleanup, render } from '@testing-library/react';
import { Activity, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { ReactNativeMedia } from '../../media/react-native-media';
import { useMedia } from '../../player/context';
import { createPlayer } from '../../player/create-player';
import { useMediaInstance } from '../use-media-instance';

describe('useMediaInstance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('replaces owned media destroyed while an Activity was hidden', () => {
    const setup = vi.fn();
    let media!: ReactNativeMedia;

    function Owned() {
      media = useMediaInstance(ReactNativeMedia, setup);
      return null;
    }

    function App({ mode }: { mode: 'visible' | 'hidden' }) {
      return (
        <Activity mode={mode}>
          <Owned />
        </Activity>
      );
    }

    const { rerender } = render(<App mode="visible" />);
    const original = media;

    rerender(<App mode="hidden" />);
    act(() => vi.runAllTimers());

    expect(original.handle).toBeNull();

    rerender(<App mode="visible" />);

    expect(media).not.toBe(original);
    expect(media.handle).not.toBeNull();
    expect(media.paused).toBe(true);
    expect(setup.mock.calls).toEqual([[original], [media]]);

    void media.play();

    expect(media.paused).toBe(false);
  });

  it('keeps the same owned media and runs setup once in StrictMode', () => {
    const setup = vi.fn();
    let media!: ReactNativeMedia;

    function Owned() {
      media = useMediaInstance(ReactNativeMedia, setup);
      return null;
    }

    render(
      <StrictMode>
        <Owned />
      </StrictMode>
    );
    act(() => vi.runAllTimers());

    expect(setup).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenCalledWith(media);
    expect(media.handle).not.toBeNull();
  });

  it('does not destroy or recreate media provided by a player', () => {
    const setup = vi.fn();
    const { Player } = createPlayer({ features: [] });
    let provided!: ReactNativeMedia;
    let seen!: ReactNativeMedia;

    function Probe() {
      provided = useMedia();
      seen = useMediaInstance(ReactNativeMedia, setup);
      return null;
    }

    function App({ mode }: { mode: 'visible' | 'hidden' }) {
      return (
        <Player>
          <Activity mode={mode}>
            <Probe />
          </Activity>
        </Player>
      );
    }

    const { rerender } = render(<App mode="visible" />);

    expect(seen).toBe(provided);

    const destroy = vi.spyOn(provided, 'destroy');

    rerender(<App mode="hidden" />);
    act(() => vi.runAllTimers());
    rerender(<App mode="visible" />);
    act(() => vi.runAllTimers());

    expect(seen).toBe(provided);
    expect(destroy).not.toHaveBeenCalled();
    expect(provided.handle).not.toBeNull();
    expect(setup).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenCalledWith(provided);
  });
});

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import BasicUsage from '../BasicUsage';

describe('BasicUsage', () => {
  beforeEach(() => {
    const preference = Object.assign(new window.EventTarget(), { matches: false });

    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => preference)
    );
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(['AbortError', 'NotAllowedError'])('ignores a stale %s after motion is enabled again', async (name) => {
    let rejectPlay!: (reason: DOMException) => void;
    const pendingPlay = new Promise<void>((_resolve, reject) => {
      rejectPlay = reject;
    });
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue().mockReturnValueOnce(pendingPlay);
    const { container } = render(<BasicUsage />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide background motion' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show background motion' }));

    await act(async () => {
      rejectPlay(new DOMException('Playback interrupted', name));
    });

    expect(play).toHaveBeenCalledTimes(2);
    expect(container.querySelector('section')).toHaveAttribute('data-motion-enabled');
    expect(screen.getByRole('button')).toHaveTextContent('Hide background motion');
  });

  it('shows the poster when the current play request fails', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(
      new DOMException('Playback blocked', 'NotAllowedError')
    );
    const { container } = render(<BasicUsage />);

    await act(async () => {});

    expect(container.querySelector('section')).not.toHaveAttribute('data-motion-enabled');
    expect(screen.getByRole('button')).toHaveTextContent('Show background motion');
  });
});

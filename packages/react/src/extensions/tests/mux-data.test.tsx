import { render } from '@testing-library/react';
import { MuxDataExtension } from '@videojs/mux-data';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../testing/mocks';
import { MuxData } from '../mux-data';

describe('MuxData', () => {
  it('registers a MuxDataExtension with the surrounding player', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    render(<MuxData />, { wrapper: Wrapper });

    expect(extensions.get(MuxDataExtension)).toBeInstanceOf(MuxDataExtension);
  });

  it('syncs props to the extension', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    render(<MuxData envKey="test-key" playerSoftwareName="mux-video" disableCookies />, { wrapper: Wrapper });

    const extension = extensions.get(MuxDataExtension)!;

    expect(extension.envKey).toBe('test-key');
    expect(extension.playerSoftwareName).toBe('mux-video');
    expect(extension.disableCookies).toBe(true);
  });

  it('disables monitoring when MuxDataSdk is explicitly undefined', () => {
    const { extensions, Wrapper } = createPlayerWrapper();
    const MuxDataSdk = {
      monitor: vi.fn(),
      utils: { now: () => 0 },
    } as unknown as NonNullable<MuxDataExtension['MuxDataSdk']>;

    const { rerender } = render(<MuxData MuxDataSdk={MuxDataSdk} />, { wrapper: Wrapper });
    const extension = extensions.get(MuxDataExtension)!;

    expect(extension.MuxDataSdk).toBe(MuxDataSdk);

    rerender(<MuxData MuxDataSdk={undefined} />);
    expect(extension.MuxDataSdk).toBeUndefined();

    rerender(<MuxData />);
    expect(extension.MuxDataSdk).toBeDefined();
  });

  it('resets a removed prop to its default', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { rerender } = render(<MuxData disableCookies />, { wrapper: Wrapper });

    rerender(<MuxData />);

    expect(extensions.get(MuxDataExtension)!.disableCookies).toBe(false);
  });

  it('keeps the extension alive across media changes while mounted', () => {
    const { extensions, Wrapper } = createPlayerWrapper();
    const destroy = vi.spyOn(MuxDataExtension.prototype, 'destroy');
    const first = document.createElement('video');
    const second = document.createElement('video');

    render(<MuxData MuxDataSdk={undefined} />, { wrapper: Wrapper });

    const extension = extensions.get(MuxDataExtension)!;

    extensions.attach({ media: first, container: null });
    extensions.attach({ media: second, container: null });

    // The player moves the extension between media; only unmount destroys it.
    expect(destroy).not.toHaveBeenCalled();
    expect(extensions.get(MuxDataExtension)).toBe(extension);

    destroy.mockRestore();
  });

  it('releases the extension on unmount', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { unmount } = render(<MuxData />, { wrapper: Wrapper });

    unmount();

    expect(extensions.get(MuxDataExtension)).toBeUndefined();
  });
});

import { render } from '@testing-library/react';
import { GoogleCastExtension } from '@videojs/google-cast';
import { describe, expect, it } from 'vite-plus/test';

import { createPlayerWrapper } from '../../testing/mocks';
import { GoogleCast } from '../google-cast';

describe('GoogleCast', () => {
  it('registers a GoogleCastExtension with the surrounding player', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    render(<GoogleCast />, { wrapper: Wrapper });

    expect(extensions.get(GoogleCastExtension)).toBeInstanceOf(GoogleCastExtension);
  });

  it('follows the media the player attaches, a plain video included', () => {
    const { extensions, Wrapper } = createPlayerWrapper();
    const video = document.createElement('video');

    video.src = 'https://example.com/video.mp4';

    render(<GoogleCast />, { wrapper: Wrapper });
    extensions.attach({ media: video, container: null });

    expect(extensions.get(GoogleCastExtension)!.src).toBe('https://example.com/video.mp4');
  });

  it('syncs props to the extension', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    render(<GoogleCast receiver="APP_ID" contentType="application/x-mpegURL" streamType="live" />, {
      wrapper: Wrapper,
    });

    const extension = extensions.get(GoogleCastExtension)!;

    expect(extension.receiver).toBe('APP_ID');
    expect(extension.contentType).toBe('application/x-mpegURL');
    expect(extension.streamType).toBe('live');
  });

  it('resets a removed prop to its default', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { rerender } = render(<GoogleCast receiver="APP_ID" />, { wrapper: Wrapper });

    rerender(<GoogleCast />);

    expect(extensions.get(GoogleCastExtension)!.receiver).toBeUndefined();
  });

  it('releases the extension on unmount', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { unmount } = render(<GoogleCast />, { wrapper: Wrapper });

    unmount();

    expect(extensions.get(GoogleCastExtension)).toBeUndefined();
  });
});

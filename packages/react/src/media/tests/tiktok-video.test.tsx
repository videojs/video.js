import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { TikTokVideo } from '../tiktok-video';

const SRC = 'https://www.tiktok.com/@videojs/video/7273420104193772846';

describe('TikTokVideo', () => {
  it('renders an empty frame under preload="none" until playback is requested', () => {
    const { container } = render(<TikTokVideo src={SRC} preload="none" />);

    expect(container.querySelector('iframe')!.hasAttribute('src')).toBe(false);
  });

  it('renders the embed under preload="none" when autoPlay asks to play now', () => {
    const { container } = render(<TikTokVideo src={SRC} preload="none" autoPlay />);

    expect(container.querySelector('iframe')!.getAttribute('src')).toContain(
      'https://www.tiktok.com/player/v1/7273420104193772846'
    );
  });
});

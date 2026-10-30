import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { CloudflareVideo } from '../cloudflare-video';

const SRC = 'https://watch.cloudflarestream.com/ea95132c15732412d22c1476fa83f27a';

describe('CloudflareVideo', () => {
  it('renders the embed from its props', () => {
    const { container } = render(<CloudflareVideo src={SRC} />);

    expect(container.querySelector('iframe')!.getAttribute('src')).toContain(
      'https://iframe.videodelivery.net/ea95132c15732412d22c1476fa83f27a?'
    );
  });

  it('renders an empty frame under preload="none" until playback is requested', () => {
    const { container } = render(<CloudflareVideo src={SRC} preload="none" />);

    expect(container.querySelector('iframe')!.hasAttribute('src')).toBe(false);
  });
});

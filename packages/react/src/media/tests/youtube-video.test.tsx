import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { YouTubeVideo } from '../youtube-video';

describe('YouTubeVideo', () => {
  it('starts the embed muted from the muted prop, which React never renders as an attribute', () => {
    const { container } = render(<YouTubeVideo src="https://www.youtube.com/watch?v=aqz-KE-bpKQ" autoPlay muted />);
    const params = new URL(container.querySelector('iframe')!.src).searchParams;

    expect(params.get('autoplay')).toBe('1');
    expect(params.get('mute')).toBe('1');
  });

  it('renders an empty frame under preload="none" until playback is requested', () => {
    const { container } = render(<YouTubeVideo src="https://www.youtube.com/watch?v=aqz-KE-bpKQ" preload="none" />);

    expect(container.querySelector('iframe')!.hasAttribute('src')).toBe(false);
  });

  it('renders the embed under preload="none" when controls are shown', () => {
    const { container } = render(
      <YouTubeVideo src="https://www.youtube.com/watch?v=aqz-KE-bpKQ" preload="none" controls />
    );

    expect(container.querySelector('iframe')!.getAttribute('src')).toContain(
      'https://www.youtube.com/embed/aqz-KE-bpKQ'
    );
  });
});

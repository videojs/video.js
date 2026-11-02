import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vite-plus/test';

import { YouTubeVideo } from '../youtube-video';

describe('YouTubeVideo', () => {
  it('starts the embed muted from the muted prop, which React never renders as an attribute', () => {
    const { container } = render(<YouTubeVideo src="https://www.youtube.com/watch?v=aqz-KE-bpKQ" autoPlay muted />);
    const params = new URL(container.querySelector('iframe')!.src).searchParams;

    expect(params.get('autoplay')).toBe('1');
    expect(params.get('mute')).toBe('1');
  });

  it("hands the player a media that reports the embed's playback rate range", () => {
    const mediaRef = createRef<{ playbackRateRange: unknown }>();

    render(<YouTubeVideo src="https://www.youtube.com/watch?v=aqz-KE-bpKQ" mediaRef={mediaRef as never} />);

    expect(mediaRef.current?.playbackRateRange).toEqual({ min: 0.25, max: 2 });
  });
});

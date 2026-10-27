import { describe, expect, it } from 'vite-plus/test';

import { YouTubeVideo } from '../youtube-video/adapter';

const SRC = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

describe('YouTubeVideo', () => {
  it('renders the embed from its attributes', () => {
    expect(YouTubeVideo.getTemplateHTML({ src: SRC })).toContain('src="https://www.youtube.com/embed/aqz-KE-bpKQ?');
  });

  it('renders an empty frame under preload="none" until playback is requested', () => {
    expect(YouTubeVideo.getTemplateHTML({ src: SRC, preload: 'none' })).not.toMatch(/<iframe[^>]*\ssrc=/);
  });

  it('renders the embed under preload="none" when autoplay is set', () => {
    expect(YouTubeVideo.getTemplateHTML({ src: SRC, preload: 'none', autoplay: '' })).toContain('autoplay=1');
  });

  it('renders the embed under preload="none" when controls are shown', () => {
    expect(YouTubeVideo.getTemplateHTML({ src: SRC, preload: 'none', controls: '' })).toContain(
      'src="https://www.youtube.com/embed/aqz-KE-bpKQ?'
    );
  });
});

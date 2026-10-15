import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';

import { HlsAudio } from '../hls-audio';
import { HlsVideo } from '../hls-video';
import { MuxAudio } from '../mux-audio/spf';
import { MuxVideo } from '../mux-video/spf';

describe.each([
  ['HlsVideo', HlsVideo],
  ['HlsAudio', HlsAudio],
  ['MuxVideo (SPF)', MuxVideo],
  ['MuxAudio (SPF)', MuxAudio],
] as const)('%s crossOrigin', (_, Media) => {
  it.each(['', 'anonymous', 'use-credentials'] as const)(
    'renders crossorigin="%s" before default tracks load and preserves it through hydration',
    (crossOrigin) => {
      const ui = (
        <Media crossOrigin={crossOrigin}>
          <track kind="metadata" src="https://media.example.com/storyboard.vtt" default />
        </Media>
      );
      const container = document.createElement('div');

      container.innerHTML = renderToString(ui);
      const media = container.querySelector<HTMLMediaElement>('video, audio')!;

      expect(media.getAttribute('crossorigin')).toBe(crossOrigin);
      expect(media.querySelector('track')?.default).toBe(true);

      render(ui, { container, hydrate: true });

      expect(media.getAttribute('crossorigin')).toBe(crossOrigin || 'anonymous');
      expect(media.crossOrigin).toBe(crossOrigin || 'anonymous');
    }
  );

  it('updates and removes crossorigin when the prop changes', () => {
    const { container, rerender } = render(<Media crossOrigin="anonymous" />);
    const media = container.querySelector<HTMLMediaElement>('video, audio')!;

    rerender(<Media crossOrigin="use-credentials" />);
    expect(media.getAttribute('crossorigin')).toBe('use-credentials');

    rerender(<Media />);
    expect(media.hasAttribute('crossorigin')).toBe(false);
    expect(media.crossOrigin).toBeNull();
  });
});

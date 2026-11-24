// @vitest-environment happy-dom

import { registerI18n } from '@videojs/core/i18n';
import translations from '@videojs/core/i18n/locales/nl';
import { describe, expect, it } from 'vite-plus/test';

describe('@videojs/cdn/live-video', () => {
  it('translates control labels with a registered locale and the document language', async () => {
    registerI18n('nl', translations);
    document.documentElement.lang = 'nl';
    document.body.innerHTML = /*html*/ `
      <media-i18n>
        <live-video-player>
          <media-container>
            <video></video>
            <media-play-button></media-play-button>
          </media-container>
        </live-video-player>
      </media-i18n>
    `;

    const video = document.querySelector('video')!;

    // Happy DOM returns void here, while browsers return a promise.
    Object.defineProperty(video.remote, 'cancelWatchAvailability', {
      value: () => Promise.resolve(),
    });

    await import('../live-video');

    const playButton = document.querySelector('media-play-button')!;

    await expect.poll(() => playButton.getAttribute('aria-label')).toBe('Afspelen');
  });
});

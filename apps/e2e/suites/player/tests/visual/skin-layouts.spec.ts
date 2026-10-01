import { expect, test } from '@playwright/test';

import { PlayerPage } from '../../../../shared/page-objects/player';

/**
 * Layout snapshots of every packaged skin at the widths where its layout changes. These hold the shipped CSS skins to
 * their baselines over time; the skin-parity suite compares stylings and sources of one skin in the same page instead.
 */

const VIDEO_WIDTHS = [320, 800] as const;
const AUDIO_WIDTHS = [384, 672] as const;

const LAYOUTS = [
  { framework: 'html', skin: 'default', media: 'video', path: '/pages/html-video-mp4.html', sizes: 'video-skin' },
  {
    framework: 'html',
    skin: 'neutral',
    media: 'video',
    path: '/pages/html-video-neutral-mp4.html',
    sizes: 'video-neutral-skin',
  },
  { framework: 'react', skin: 'default', media: 'video', path: '/pages/react-video-mp4.html', sizes: '.media-skin' },
  {
    framework: 'react',
    skin: 'neutral',
    media: 'video',
    path: '/pages/react-video-neutral-mp4.html',
    sizes: '.media-skin',
  },
  { framework: 'html', skin: 'default', media: 'audio', path: '/pages/html-audio-mp4.html', sizes: '#root > div' },
  {
    framework: 'html',
    skin: 'neutral',
    media: 'audio',
    path: '/pages/html-audio-neutral-mp4.html',
    sizes: '#root > div',
  },
  { framework: 'react', skin: 'default', media: 'audio', path: '/pages/react-audio-mp4.html', sizes: '.media-skin' },
  {
    framework: 'react',
    skin: 'neutral',
    media: 'audio',
    path: '/pages/react-audio-neutral-mp4.html',
    sizes: '.media-skin',
  },
] as const;

for (const { framework, skin, media, path, sizes } of LAYOUTS) {
  test.describe(`Visual — ${skin} ${media} skin layout (${framework})`, () => {
    let player: PlayerPage;

    test.beforeEach(async ({ page }) => {
      player = new PlayerPage(page);
      await page.goto(path);
      await player.waitForMediaReady();
    });

    for (const width of media === 'video' ? VIDEO_WIDTHS : AUDIO_WIDTHS) {
      test(`paused at ${width}px`, async ({ page }) => {
        // The page caps the player at its widest layout; pin the element that carries that cap to one width.
        await page
          .locator(sizes)
          .first()
          .evaluate((element: HTMLElement, value) => {
            element.style.maxWidth = 'none';
            element.style.width = `${value}px`;
          }, width);

        if (media === 'video') await player.showControls();

        await expect(player.playerRoot).toHaveScreenshot(`layout-${framework}-${skin}-${media}-${width}.png`);
      });
    }
  });
}

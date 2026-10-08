import { expect, type Page, test } from '@playwright/test';

import { CAPTIONS, MEDIA } from '../../../shared/fixtures/resources';
import { DATA_ATTRS, SELECTORS } from '../../../shared/fixtures/selectors';
import { PlayerPage } from '../../../shared/page-objects/player';

test.describe('Captions', () => {
  let player: PlayerPage;

  test.beforeEach(async ({ page }) => {
    player = new PlayerPage(page);
    await page.goto('/pages/html-video-mp4.html');
    await player.waitForMediaReady();
  });

  test('captions settings are unavailable without subtitle tracks', async () => {
    await player.showControls();
    await player.settingsButton.click();
    await expect(player.settingsCaptionsItem).toHaveAttribute(DATA_ATTRS.availability, 'unavailable');
    await expect(player.settingsCaptionsItem).toHaveAttribute('aria-disabled', 'true');
  });

  test('captions settings lists tracks when subtitle track is added', async ({ page }) => {
    await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (!video) return;

      const track = document.createElement('track');

      track.kind = 'subtitles';
      track.label = 'English';
      track.srclang = 'en';
      track.src = `data:text/vtt,${encodeURIComponent('WEBVTT\n\n00:00:00.000 --> 00:00:30.000\nTest caption')}`;
      video.appendChild(track);
    });

    await player.showControls();
    await player.openCaptionsSettings();

    const options = page.locator(SELECTORS.activeMenuOptions);

    await expect(options).toHaveCount(2, { timeout: 5_000 });
  });

  test('captions button toggles captions', async ({ page }) => {
    await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (!video) return;

      const track = document.createElement('track');

      track.kind = 'subtitles';
      track.label = 'English';
      track.srclang = 'en';
      track.src = `data:text/vtt,${encodeURIComponent('WEBVTT\n\n00:00:00.000 --> 00:00:30.000\nTest caption')}`;
      video.appendChild(track);
    });

    await player.showControls();
    await player.captionsButton.click();
    await expect(player.captionsButton).toHaveAttribute(DATA_ATTRS.active, '');
    await player.captionsButton.click();
    await expect(player.captionsButton).not.toHaveAttribute(DATA_ATTRS.active);
  });
});

/**
 * Hls.js resets every text track on the media element when it attaches, detaches, or loads a source, so a `<track>`
 * that loaded before the source was known used to end up selected but empty — the browser never parses a loaded track
 * again.
 *
 * Losing cues is the part no one can undo, so that is what these assert. Which track is selected afterwards is the
 * browser's call: loading a source re-runs automatic text-track selection, and WebKit turns off caption tracks it did
 * not pick itself. `withPreservedTextTracks` unit tests cover the mode it restores.
 */
test.describe('Captions sideloaded before an hls.js source', () => {
  /**
   * Cues on the sideloaded track, read from the element the page author sees. A disabled track reports no cues at all,
   * so read them through a mode that exposes them and put the track back the way it was found.
   */
  const englishCues = (page: Page) => {
    return page.evaluate(() => {
      const media = document.querySelector<HTMLVideoElement>('hlsjs-video');
      const track = Array.from(media?.textTracks ?? []).find(({ label }) => label === 'English');
      if (!track) return -1;

      const { mode } = track;

      if (mode === 'disabled') track.mode = 'hidden';

      const cues = track.cues?.length ?? 0;

      if (mode === 'disabled') track.mode = mode;

      return cues;
    });
  };

  /**
   * Selects the track from the page rather than leaning on its `default` attribute. The element clones `<track>`
   * children into its inner `<video>`, and whether a script-added track wins automatic text-track selection is up to
   * the browser's caption preferences — WebKit leaves it `disabled`, which also stops it from ever loading its cues. A
   * track has to be enabled once to load them, which is the state these tests are about.
   */
  const showEnglishTrack = (page: Page) => {
    return page.waitForFunction(() => {
      const media = document.querySelector<HTMLVideoElement>('hlsjs-video');
      const track = Array.from(media?.textTracks ?? []).find(({ label }) => label === 'English');
      if (!track) return false;

      track.mode = 'showing';
      return true;
    });
  };

  const waitForManifest = (page: Page) => {
    return page.waitForFunction(() => (document.querySelector<HTMLVideoElement>('hlsjs-video')?.readyState ?? 0) >= 1);
  };

  const setSource = (page: Page, url: string) => {
    return page.evaluate((src) => {
      const media = document.querySelector<HTMLVideoElement>('hlsjs-video');

      if (media) media.src = src;
    }, url);
  };

  test.beforeEach(async ({ page }) => {
    // Reuse the page's registered elements, but start from a media component that
    // has caption tracks and no source yet.
    await page.goto('/pages/html-video-hls.html');
    await page.evaluate((vtt) => {
      document.getElementById('root')!.innerHTML = `
        <video-player>
          <video-skin style="max-width: 800px; aspect-ratio: 16/9">
            <hlsjs-video playsinline>
              <track default kind="subtitles" label="English" srclang="en" src="${vtt}" />
            </hlsjs-video>
          </video-skin>
        </video-player>`;
    }, CAPTIONS.english);

    await showEnglishTrack(page);
    await expect.poll(() => englishCues(page)).toBe(1);
  });

  test('keeps its cues when the source is assigned after connection', async ({ page }) => {
    await setSource(page, MEDIA.hlsTs.url);
    await waitForManifest(page);

    expect(await englishCues(page)).toBe(1);
  });

  test('keeps its cues when the source is replaced', async ({ page }) => {
    await setSource(page, MEDIA.hlsTs.url);
    await waitForManifest(page);

    await setSource(page, MEDIA.hlsFmp4.url);
    await waitForManifest(page);

    expect(await englishCues(page)).toBe(1);
  });
});

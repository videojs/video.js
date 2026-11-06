import { expect, test } from '@playwright/test';

import { PlayerPage } from '../../../shared/page-objects/player';

/**
 * Consumers restyle the packaged skins from plain, unlayered stylesheets. The skin rules live in a cascade layer, so a
 * consumer selector of the same specificity has to win without `!important`.
 */
test.describe('Skin overrides — React', () => {
  test('semantic CSS stays easy to override from unlayered consumer styles', async ({ page }) => {
    const player = new PlayerPage(page);

    await page.goto('/pages/react-video-mp4.html');
    await player.waitForMediaReady();
    await page.addStyleTag({
      content: '.media-play-button { width: 44px; height: 44px; background: rgb(18 52 86); }',
    });

    // WebKit also exposes the AirPlay button, whose name contains "Play".
    const play = player.playerRoot.getByRole('button', { name: 'Play', exact: true }).last();

    await expect(play).toHaveCSS('width', '44px');
    await expect(play).toHaveCSS('height', '44px');
    await expect(play).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  });
});

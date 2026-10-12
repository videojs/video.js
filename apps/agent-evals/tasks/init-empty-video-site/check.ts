import type { TaskCheck } from '../../src/grade/browser.ts';

const MEDIA = 'video, audio';
// Same-site links and the controls a film card is made of, in page order.
const CANDIDATES = 'a[href]:not([href^="http"]):not([href^="#"]):not([href^="mailto:"]), button, [role="button"]';

/**
 * A site for several films often plays them on a page of their own, or opens the player from a card. When the home page
 * has no media, follow the first few candidates until one leads to a player.
 */
export const afterLoad: TaskCheck['afterLoad'] = async (page) => {
  const found = () =>
    page
      .locator(MEDIA)
      .first()
      .waitFor({ state: 'attached', timeout: 5_000 })
      .then(
        () => true,
        () => false
      );
  if (await found()) return;

  const home = page.url();

  for (let index = 0; index < 5; index += 1) {
    const candidate = page.locator(CANDIDATES).nth(index);
    if ((await candidate.count()) === 0) return;

    await candidate.click({ timeout: 3_000 }).catch(() => {});
    await page.waitForLoadState('load').catch(() => {});

    if (await found()) return;

    if (page.url() !== home) await page.goto(home, { waitUntil: 'load' }).catch(() => {});
  }
};

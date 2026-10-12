import type { Locator, Page } from 'playwright';

import type { TaskAssertion, TaskCheck } from '../../src/grade/browser.ts';
import { allShown, assertion, describe, revealControls, shown } from '../../src/grade/task-checks.ts';

const POSTER = 'lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/thumbnail';
const UP_NEXT = /up next/i;
const RATE = /^1[.,]5\s*[x×]?$/i;

/** Whether the centre of `inner` lies inside `outer`, as a control drawn over the player does. */
async function inside(inner: Locator, outer: Locator): Promise<boolean> {
  const a = await inner.boundingBox().catch(() => null);
  const b = await outer.boundingBox().catch(() => null);
  if (!a || !b) return false;

  const x = a.x + a.width / 2;
  const y = a.y + a.height / 2;

  return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
}

async function posterShown(page: Page, media: Locator): Promise<TaskAssertion> {
  const images = await allShown(page.locator(`img[src*="${POSTER}"], img[srcset*="${POSTER}"]`));
  let loaded = false;

  for (const image of images) {
    if (await image.evaluate((element) => (element as HTMLImageElement).naturalWidth > 0)) loaded = true;
  }

  const native = await media.evaluate(
    (element, poster) => (element as HTMLVideoElement).poster?.includes(poster) ?? false,
    POSTER
  );

  return assertion(
    'poster before playback',
    loaded || native,
    loaded ? 'image' : native ? 'video poster' : 'not shown'
  );
}

async function captionsLoad(media: Locator): Promise<TaskAssertion> {
  const cues = await media.evaluate(async (element) => {
    const english = [...(element as HTMLMediaElement).textTracks].filter(
      (track) =>
        (track.kind === 'captions' || track.kind === 'subtitles') &&
        (/^en\b/i.test(track.language) || /english/i.test(track.label))
    );

    // A disabled track never fetches its file; hidden loads the cues without showing them.
    for (const track of english) if (track.mode === 'disabled') track.mode = 'hidden';

    for (const deadline = Date.now() + 5_000; Date.now() < deadline;) {
      if (english.some((track) => (track.cues?.length ?? 0) > 0)) break;

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return english.length === 0 ? null : Math.max(...english.map((track) => track.cues?.length ?? 0));
  });

  return assertion(
    'English captions load',
    (cues ?? 0) > 0,
    cues === null ? 'no English captions track' : `${cues} cues`
  );
}

async function downloadControl(page: Page, player: Locator): Promise<TaskAssertion> {
  await revealControls(player);

  const controls = await allShown(
    page.getByRole('button', { name: /download/i }).or(page.getByRole('link', { name: /download/i }))
  );
  const found = [];

  for (const control of controls) if (await inside(control, player)) found.push(control);

  return assertion(
    'Download control in the player',
    found.length > 0,
    found[0] ? await describe(found[0]) : controls.length > 0 ? 'only outside the player' : 'none'
  );
}

/**
 * Picks 1.5 from whatever playback-rate control the player has: an option already on screen, one inside a settings or
 * speed menu, or a button that steps through the rates.
 */
async function choosePlaybackRate(page: Page, player: Locator, media: Locator): Promise<TaskAssertion> {
  const rate = () => media.evaluate((element) => (element as HTMLMediaElement).playbackRate);
  const option = () =>
    allShown(
      page
        .getByRole('menuitemradio', { name: RATE })
        .or(page.getByRole('radio', { name: RATE }))
        .or(page.getByRole('option', { name: RATE }))
        .or(page.getByRole('menuitem', { name: RATE }))
    );
  const pick = async () => {
    const [choice] = await option();
    if (!choice) return false;

    await choice.click({ timeout: 3_000 }).catch(() => choice.click({ force: true, timeout: 3_000 }).catch(() => {}));
    await page.waitForTimeout(300);

    return true;
  };

  await revealControls(player);

  let offered = await pick();

  for (const opener of offered
    ? []
    : await allShown(page.getByRole('button', { name: /settings|speed|playback|rate/i }))) {
    if (offered) break;

    await revealControls(player);
    await opener.click({ timeout: 3_000 }).catch(() => {});
    await page.waitForTimeout(400);
    offered = await pick();

    // A settings menu lists a speed item that opens the rates.
    for (const item of offered ? [] : await allShown(page.getByRole('menuitem', { name: /speed|playback|rate/i }))) {
      await item.click({ timeout: 3_000 }).catch(() => {});
      await page.waitForTimeout(400);
      offered = await pick();

      if (offered) break;
    }

    // A button that steps through the rates.
    for (let step = 0; !offered && step < 10 && (await shown(opener)) && (await rate()) !== 1.5; step += 1) {
      const before = await rate();

      await opener.click({ timeout: 3_000 }).catch(() => {});
      await page.waitForTimeout(250);

      if ((await rate()) === before) break;
    }

    if ((await rate()) === 1.5) offered = true;

    await page.keyboard.press('Escape').catch(() => {});
  }

  const after = await rate();

  return assertion('playback rate 1.5 selectable', offered && after === 1.5, `playbackRate ${after}`);
}

/** The Video.js 8 player's features, each still working: poster, captions, the Download control, and no overlay yet. */
export const beforePlayback: TaskCheck['beforePlayback'] = async ({ page, media, player }) => [
  await posterShown(page, media),
  await captionsLoad(media),
  await downloadControl(page, player),
  assertion('"Up next" hidden before the end', (await allShown(page.getByText(UP_NEXT))).length === 0),
];

/** A 1.5× playback rate from the player's controls, and the "Up next" overlay once the video ends. */
export const afterPlayback: TaskCheck['afterPlayback'] = async ({ page, media, player }) => {
  const results = [await choosePlaybackRate(page, player, media)];
  const ended = await media
    .evaluate(
      (element) =>
        new Promise<boolean>((resolve) => {
          const target = element as HTMLMediaElement;

          target.addEventListener('ended', () => resolve(true), { once: true });
          target.currentTime = Math.max(0, target.duration - 1.5);
          void target.play().catch(() => {});
          setTimeout(() => resolve(target.ended), 15_000);
        })
    )
    .catch(() => false);

  let overlay = false;

  for (const deadline = Date.now() + 3_000; ended && !overlay && Date.now() < deadline;) {
    overlay = (await allShown(page.getByText(UP_NEXT))).length > 0;

    if (!overlay) await page.waitForTimeout(250);
  }

  results.push(assertion('"Up next" shown when the video ends', overlay, ended ? undefined : 'the video never ended'));

  return results;
};

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Page } from 'playwright';

import type { TaskCheck } from '../../src/grade/browser.ts';
import { assertion } from '../../src/grade/task-checks.ts';

// The grader's play button selector, which the standard playback check presses on the first card.
const PLAY_BUTTON =
  'media-play-button, .media-play-button, button[aria-keyshortcuts~="Space"], button[aria-label="Play" i]';
const CARDS = 6;
const CODE = /\.(?:[cm]?[jt]sx?)$/;
const REACT_PLAYER = /(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)['"]react-player(?:\/[^'"]*)?['"]/;

interface MediaState {
  paused: boolean;
  currentTime: number;
}

/** React-player is gone: out of package.json and out of every source file. */
export const project: TaskCheck['project'] = ({ appDir, files }) => {
  const pkg = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8')) as Record<
    string,
    Record<string, string> | undefined
  >;
  const declared = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].filter(
    (field) => pkg[field]?.['react-player'] !== undefined
  );
  const importers = files.filter(
    (file) => CODE.test(file) && REACT_PLAYER.test(readFileSync(join(appDir, file), 'utf8'))
  );

  return [
    assertion('react-player removed from package.json', declared.length === 0, declared.join(', ') || undefined),
    assertion('no react-player imports', importers.length === 0, importers.join(', ') || undefined),
  ];
};

/**
 * Tags each card's play button with its card's index: the nearest ancestor of the card's media element that holds a
 * play button, in the page or in a skin's shadow root.
 */
async function tagPlayButtons(page: Page): Promise<number> {
  return page.evaluate((selector) => {
    let tagged = 0;

    document.querySelectorAll('video, audio').forEach((media, index) => {
      for (let node: Element | null = media.parentElement; node; node = node.parentElement) {
        const button = node.querySelector(selector) ?? node.shadowRoot?.querySelector(selector);

        if (button) {
          button.setAttribute('data-eval-card', String(index));
          tagged += 1;
          break;
        }
      }
    });

    return tagged;
  }, PLAY_BUTTON);
}

function mediaStates(page: Page): Promise<MediaState[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('video, audio')].map((element) => {
      const media = element as HTMLMediaElement;

      return { paused: media.paused, currentTime: media.currentTime };
    })
  );
}

/** Six cards, each with its own player. */
export const beforePlayback: TaskCheck['beforePlayback'] = async ({ page }) => {
  const media = await page.locator('video, audio').count();
  const buttons = await tagPlayButtons(page);

  return [
    assertion(`${CARDS} video cards with media`, media === CARDS, `${media} media elements`),
    assertion(`${CARDS} cards with a play button`, buttons === CARDS, `${buttons} play buttons`),
  ];
};

/**
 * The standard check started the first card. Starting the fourth card should leave it playing and the first paused,
 * with no other card playing.
 */
export const afterPlayback: TaskCheck['afterPlayback'] = async ({ page }) => {
  const before = await mediaStates(page);
  const button = page.locator('[data-eval-card="3"]');

  // Tag again in case the first card's start re-rendered the grid.
  await tagPlayButtons(page);

  if (!before[0] || before[0].paused) {
    return [assertion('first card plays', false, 'The standard check did not start the first card.')];
  }

  if ((await button.count()) === 0) return [assertion('fourth card has a play button', false)];

  await button.click({ timeout: 10_000 }).catch(() => button.click({ force: true, timeout: 5_000 }));

  let after = await mediaStates(page);

  for (const deadline = Date.now() + 15_000; Date.now() < deadline;) {
    after = await mediaStates(page);

    if (!after[3]?.paused && (after[3]?.currentTime ?? 0) > 0.5 && after[0]?.paused) break;

    await page.waitForTimeout(500);
  }

  // Let a late pause, or a card that resumes itself, show up before counting.
  await page.waitForTimeout(1_000);
  after = await mediaStates(page);

  const playing = after.flatMap((state, index) => (state.paused ? [] : [index + 1]));
  const describe = after.map((state, index) => `${index + 1}:${state.paused ? 'paused' : 'playing'}`).join(' ');

  return [
    assertion('fourth card plays', !after[3]?.paused && (after[3]?.currentTime ?? 0) > 0.5, describe),
    assertion('first card paused when the fourth starts', after[0]?.paused === true, describe),
    assertion('one card playing', playing.length === 1, `playing: ${playing.join(', ') || 'none'}`),
  ];
};

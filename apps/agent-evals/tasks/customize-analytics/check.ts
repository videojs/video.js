import type { Page } from 'playwright';

import type { TaskCheck } from '../../src/grade/browser.ts';
import { assertion, revealControls } from '../../src/grade/task-checks.ts';

interface TrackCall {
  event: string;
  currentTime: unknown;
}

const PLAY = /play|start/i;
const PAUSE = /pause/i;
const END = /end|complete|finish/i;

/**
 * Wraps `window.acme.track` the moment the page's own snippet assigns `window.acme`, so every call the app makes is
 * recorded, however the app reaches the function.
 */
export async function beforeLoad(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const calls: TrackCall[] = [];
    let acme: unknown;

    Object.defineProperty(window, '__acmeCalls', { value: calls });
    Object.defineProperty(window, 'acme', {
      configurable: true,
      get: () => acme,
      set(value: unknown) {
        acme = value;

        if (!value || typeof value !== 'object') return;

        let track = (value as { track?: unknown }).track;

        Object.defineProperty(value, 'track', {
          configurable: true,
          enumerable: true,
          get: () =>
            typeof track === 'function'
              ? function (this: unknown, event: unknown, properties?: { currentTime?: unknown }) {
                  calls.push({ event: String(event), currentTime: properties?.currentTime });

                  return (track as (...args: unknown[]) => unknown).apply(this, [event, properties]);
                }
              : track,
          set(next: unknown) {
            track = next;
          },
        });
      },
    });
  });
}

function calls(page: Page): Promise<TrackCall[]> {
  return page.evaluate(() => (window as unknown as { __acmeCalls?: TrackCall[] }).__acmeCalls ?? []);
}

function find(list: TrackCall[], name: RegExp, exclude: RegExp): TrackCall | undefined {
  return list.find(({ event }) => name.test(event) && !exclude.test(event));
}

function numeric(call: TrackCall | undefined): call is TrackCall & { currentTime: number } {
  return typeof call?.currentTime === 'number' && Number.isFinite(call.currentTime);
}

function describeCalls(list: TrackCall[]): string {
  return (
    list
      .slice(0, 8)
      .map(({ event, currentTime }) => `${event}(${JSON.stringify(currentTime) ?? 'undefined'})`)
      .join(', ') || 'no track() calls'
  );
}

/**
 * Playing, pausing from the player's control, and playing through to the end each send an Acme event with the video's
 * current time at that moment.
 */
export const afterPlayback: TaskCheck['afterPlayback'] = async ({ page, media, player, playButton }) => {
  const results = [];
  const mediaTime = () => media.evaluate((element) => (element as HTMLMediaElement).currentTime);

  await page.waitForTimeout(500);

  const played = find(await calls(page), PLAY, /pause|end|complete|finish|stop/i);

  results.push(assertion('play tracked with currentTime', numeric(played), describeCalls(await calls(page))));

  // Pause with the player's own control, as a viewer would, falling back to the media element.
  await revealControls(player);
  await playButton
    .click({ timeout: 5_000 })
    .catch(() => playButton.click({ force: true, timeout: 5_000 }).catch(() => {}));
  await page.waitForTimeout(500);

  if (!(await media.evaluate((element) => (element as HTMLMediaElement).paused))) {
    await media.evaluate((element) => (element as HTMLMediaElement).pause());
    await page.waitForTimeout(500);
  }

  const pausedAt = await mediaTime();
  const paused = find(await calls(page), PAUSE, END);

  results.push(
    assertion(
      'pause tracked with currentTime',
      numeric(paused) && Math.abs(paused.currentTime - pausedAt) < 2,
      `${describeCalls(await calls(page))}; paused at ${pausedAt.toFixed(1)} s`
    )
  );

  // Jump close to the end and let the video finish.
  const duration = await media.evaluate(async (element) => {
    const target = element as HTMLMediaElement;

    target.currentTime = Math.max(0, target.duration - 1.5);
    await target.play().catch(() => {});

    return target.duration;
  });
  const ended = await media
    .evaluate(
      (element) =>
        new Promise<boolean>((resolve) => {
          const target = element as HTMLMediaElement;
          if (target.ended) return resolve(true);

          target.addEventListener('ended', () => resolve(true), { once: true });
          setTimeout(() => resolve(target.ended), 15_000);
        })
    )
    .catch(() => false);
  if (!ended) return [...results, assertion('video ends', false, `duration ${duration}`)];

  await page.waitForTimeout(500);

  const finished = find(await calls(page), END, /^$/);

  results.push(
    assertion(
      'end tracked with currentTime',
      numeric(finished) && finished.currentTime >= duration - 3,
      `${describeCalls((await calls(page)).slice(-4))}; duration ${duration.toFixed(1)} s`
    )
  );

  return results;
};

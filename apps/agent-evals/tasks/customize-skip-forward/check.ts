import type { TaskCheck } from '../../src/grade/browser.ts';
import { allShown, assertion, describe, revealControls } from '../../src/grade/task-checks.ts';

/** A shown button labelled with 30 seconds forward, and pressing it moves playback ahead by about that much. */
export const afterPlayback: TaskCheck['afterPlayback'] = async ({ page, media, player }) => {
  await revealControls(player);

  const buttons = await allShown(page.getByRole('button', { name: /30/ }));
  const forward = [];

  for (const button of buttons) {
    const name = (await button.getAttribute('aria-label')) ?? (await button.textContent()) ?? '';

    if (!/back|rewind|replay|[-−]\s*30/i.test(name)) forward.push(button);
  }

  const button = forward[0];
  if (!button) return [assertion('skip forward button', false, 'No shown button labelled with 30 seconds forward.')];

  const currentTime = () => media.evaluate((element) => (element as HTMLMediaElement).currentTime);
  const before = await currentTime();

  await button.click({ timeout: 5_000 }).catch(() => button.click({ force: true, timeout: 5_000 }));

  let after = before;

  for (const deadline = Date.now() + 5_000; Date.now() < deadline && after - before < 20;) {
    await page.waitForTimeout(250);
    after = await currentTime();
  }

  return [
    assertion('skip forward button', true, await describe(button)),
    assertion('skips forward', after - before >= 20, `${before.toFixed(1)} s to ${after.toFixed(1)} s`),
  ];
};

import type { TaskCheck } from '../../src/grade/browser.ts';
import { allShown, assertion, revealControls } from '../../src/grade/task-checks.ts';

/** The player treats the stream as live, as a viewer would see it: no fixed end, and a live indicator in the controls. */
export const afterPlayback: TaskCheck['afterPlayback'] = async ({ page, media, player }) => {
  const duration = await media.evaluate((element) => (element as HTMLMediaElement).duration);

  await revealControls(player);

  const indicators = await allShown(page.locator('media-live-button, .media-live-button'));

  return [
    assertion('plays as live', duration === Infinity, `duration ${duration}`),
    assertion(
      'live indicator shown',
      indicators.length > 0,
      indicators.length > 0 ? undefined : 'no live button in the controls'
    ),
  ];
};

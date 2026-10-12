import type { TaskCheck } from '../../src/grade/browser.ts';
import { allShown, assertion } from '../../src/grade/task-checks.ts';

const PLAY_BUTTON =
  'media-play-button, .media-play-button, button[aria-keyshortcuts~="Space"], button[aria-label="Play" i]';

/** The current time sits left of the play button in the same row of controls. */
export const beforePlayback: TaskCheck['beforePlayback'] = async ({ page }) => {
  const [time] = await allShown(page.locator('time[data-type="current"], media-time[type="current"]'));
  if (!time) return [assertion('current time left of play button', false, 'No current time display.')];

  const timeBox = (await time.boundingBox())!;
  const center = (box: { x: number; y: number; width: number; height: number }) => ({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });
  const boxes = [];

  for (const button of await allShown(page.locator(PLAY_BUTTON))) {
    const box = await button.boundingBox();

    if (box) boxes.push(box);
  }

  // The play button in the same row as the time, not a large overlay button.
  const play = boxes.sort(
    (a, b) => Math.abs(center(a).y - center(timeBox).y) - Math.abs(center(b).y - center(timeBox).y)
  )[0];
  if (!play) return [assertion('current time left of play button', false, 'No play button.')];

  const sameRow = Math.abs(center(play).y - center(timeBox).y) < Math.max(play.height, timeBox.height);

  return [
    assertion(
      'current time left of play button',
      sameRow && center(timeBox).x < center(play).x,
      `time at x=${Math.round(center(timeBox).x)}, play at x=${Math.round(center(play).x)}${sameRow ? '' : ', different rows'}`
    ),
  ];
};

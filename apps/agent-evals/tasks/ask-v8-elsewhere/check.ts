import type { TaskCheck } from '../../src/grade/browser.ts';
import { assertion } from '../../src/grade/task-checks.ts';

const ABOUT_FILES = ['about.html', 'src/about.ts'];

/** The About page keeps its Video.js 8 player exactly as it was: the user asked for the home page only. */
export const project: TaskCheck['project'] = ({ files, changedFiles }) => {
  const touched = ABOUT_FILES.filter((file) => changedFiles.includes(file) || !files.includes(file));

  return [assertion('About page untouched', touched.length === 0, touched.join(', ') || undefined)];
};

/** The About page still builds, serves, and runs its Video.js 8 player beside the new one on the home page. */
export const beforePlayback: TaskCheck['beforePlayback'] = async ({ page }) => {
  const about = await page.context().newPage();

  try {
    await about.goto(new URL('/about.html', page.url()).href, { waitUntil: 'load', timeout: 30_000 });

    // Video.js 8 wraps the video it initializes and marks the element it plays through as `.vjs-tech`.
    const running = await about
      .locator('#about-player.video-js .vjs-tech')
      .waitFor({ state: 'attached', timeout: 10_000 })
      .then(
        () => true,
        () => false
      );

    return [
      assertion('About page still runs Video.js 8', running, running ? undefined : 'no initialized #about-player'),
    ];
  } finally {
    await about.close();
  }
};

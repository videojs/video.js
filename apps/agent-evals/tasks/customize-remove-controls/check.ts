import type { Page } from 'playwright';

import type { TaskCheck } from '../../src/grade/browser.ts';
import { allShown, assertion } from '../../src/grade/task-checks.ts';

/**
 * Firefox has neither picture-in-picture nor, headless, a reliable fullscreen API, and skins hide what the browser
 * cannot do. Faking both keeps the buttons in the untouched skin, so only the agent's change can remove them.
 */
export async function beforeLoad(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(Document.prototype, 'pictureInPictureEnabled', { configurable: true, get: () => true });
    Object.defineProperty(Document.prototype, 'fullscreenEnabled', { configurable: true, get: () => true });

    if (!('requestPictureInPicture' in HTMLVideoElement.prototype)) {
      Object.defineProperty(HTMLVideoElement.prototype, 'requestPictureInPicture', {
        configurable: true,
        value: () => Promise.reject(new DOMException('Picture-in-picture is faked for grading.', 'NotSupportedError')),
      });
    }
  });
}

export const beforePlayback: TaskCheck['beforePlayback'] = async ({ page }) => {
  const count = async (name: RegExp) => (await allShown(page.getByRole('button', { name }))).length;

  return [
    assertion('fullscreen button removed', (await count(/full\s*screen/i)) === 0),
    assertion('picture-in-picture button removed', (await count(/picture.in.picture|\bpip\b/i)) === 0),
    assertion('play button kept', (await count(/^(play|pause)\b/i)) > 0),
    assertion('mute button kept', (await count(/\b(mute|unmute|volume)\b/i)) > 0),
  ];
};

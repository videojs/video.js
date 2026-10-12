import type { TaskCheck, TaskCheckContext } from '../../src/grade/browser.ts';
import { allShown, assertion } from '../../src/grade/task-checks.ts';

const POSTER = 'thumbnail.webp';

/** Shown poster images with the requested URL, loaded, in the page or inside a skin's shadow root. */
async function posters({ page }: TaskCheckContext) {
  const images = await allShown(page.locator(`img[src*="${POSTER}"], img[srcset*="${POSTER}"]`));
  const loaded = [];

  for (const image of images) {
    if (await image.evaluate((element) => (element as HTMLImageElement).naturalWidth > 0)) loaded.push(image);
  }

  return loaded;
}

/** The poster shows before playback, as an image or the media element's own poster. */
export const beforePlayback: TaskCheck['beforePlayback'] = async (context) => {
  const images = await posters(context);
  const native = await context.media.evaluate(
    (element, poster) => (element as HTMLVideoElement).poster?.includes(poster) ?? false,
    POSTER
  );

  return [
    assertion(
      'poster before playback',
      images.length > 0 || native,
      images.length > 0 ? 'image' : native ? 'video poster attribute' : 'not shown'
    ),
  ];
};

/** The poster gets out of the way once the video plays. */
export const afterPlayback: TaskCheck['afterPlayback'] = async (context) => {
  const images = await posters(context);

  return [assertion('poster hidden after playback', images.length === 0)];
};

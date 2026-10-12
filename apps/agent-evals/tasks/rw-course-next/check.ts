import type { Page } from 'playwright';

import type { TaskCheck, TaskCheckContext } from '../../src/grade/browser.ts';
import { allShown, assertion } from '../../src/grade/task-checks.ts';

const LESSON_1 = 'lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4';
const LESSON_2 = 's41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ';
// The frame lesson 2's thumbnail picks in the lesson data.
const LESSON_2_FRAME = 'time=95';
// The same patterns the grader uses for media requests and hydration errors.
const MEDIA_REQUEST = /\.(?:m3u8|mpd|mp4|m4a|m4s|m4v|mp3|webm|ts|aac|ogg|mov)(?:[?#]|$)|\bstream\.mux\.com\//i;
const HYDRATION = /hydrat|did not match|server rendered HTML|Minified React error #(?:418|423|425)/i;
const PLAY_BUTTON =
  'media-play-button, .media-play-button, button[aria-keyshortcuts~="Space"], button[aria-label="Play" i]';

/** The second lesson's page, where a player that ignores the lesson data is easiest to tell apart. */
export const path = '/lessons/lighting-basics';

/** Media requests and errors a page produced. */
interface PageLog {
  media: string[];
  errors: string[];
}

const watched = new WeakMap<Page, PageLog>();

/** Records media requests and errors on a page from its first request. */
function watch(page: Page): PageLog {
  const log: PageLog = { media: [], errors: [] };

  page.on('request', (request) => {
    if (request.resourceType() === 'media' || MEDIA_REQUEST.test(request.url())) log.media.push(request.url());
  });
  page.on('pageerror', (error) => log.errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') log.errors.push(message.text());
  });
  watched.set(page, log);

  return log;
}

export const beforeLoad: TaskCheck['beforeLoad'] = async (page) => {
  watch(page);
};

/**
 * Whether a poster from a lesson's Mux thumbnail is on screen: a loaded image, in the page or a skin's shadow root, or
 * the media element's own poster. `frame` also requires the thumbnail's chosen frame (`time=`), which Mux's generated
 * poster lacks. URLs are decoded, so an image optimizer such as next/image still matches.
 */
async function posterShown(
  { page, media }: Pick<TaskCheckContext, 'page' | 'media'>,
  id: string,
  frame?: string
): Promise<boolean> {
  const matches = (url: string) => {
    let decoded = url;

    try {
      decoded = decodeURIComponent(url);
    } catch {
      // Not encoded.
    }

    return decoded.includes(`${id}/thumbnail`) && (!frame || new RegExp(`[?&]${frame}(?:&|$|\\s)`).test(decoded));
  };

  for (const image of await allShown(page.locator('img'))) {
    const { urls, loaded } = await image
      .evaluate((element) => {
        const img = element as HTMLImageElement;

        return { urls: [img.currentSrc, img.src, img.srcset], loaded: img.naturalWidth > 0 };
      })
      .catch(() => ({ urls: [] as string[], loaded: false }));
    if (loaded && urls.some(matches)) return true;
  }

  // A native poster shows until playback starts.
  const native = await media
    .evaluate((element) => {
      const video = element as HTMLVideoElement;

      return video.paused && video.currentTime === 0 ? video.poster : '';
    })
    .catch(() => '');

  return native !== '' && matches(native);
}

async function waitFor(condition: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
  for (const deadline = Date.now() + timeoutMs; Date.now() < deadline;) {
    if (await condition()) return true;

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return condition();
}

/** Lesson 2's own thumbnail shows before playback; a poster set after mount gets a few seconds to load. */
export const beforePlayback: TaskCheck['beforePlayback'] = async (context) => {
  const shown = await waitFor(() => posterShown(context, LESSON_2, LESSON_2_FRAME), 8_000);

  return [assertion("lesson 2's thumbnail before playback", shown)];
};

/**
 * On lesson 2's page: the poster gives way to the video, only lesson 2's video loads, and the server-rendered page
 * hydrates cleanly. Then lesson 1's page, in a second tab, plays lesson 1's video.
 */
export const afterPlayback: TaskCheck['afterPlayback'] = async (context) => {
  const { page } = context;
  const log = watched.get(page) ?? { media: [], errors: [] };
  const posterGone = await waitFor(async () => !(await posterShown(context, LESSON_2)), 3_000);
  const lesson1Requests = log.media.filter((url) => url.includes(LESSON_1));
  const hydration = log.errors.filter((error) => HYDRATION.test(error));

  return [
    assertion("lesson 2's thumbnail hidden after playback", posterGone),
    assertion("only lesson 2's video on its page", lesson1Requests.length === 0, lesson1Requests[0]),
    assertion('no hydration errors', hydration.length === 0, hydration[0]?.slice(0, 200)),
    await lessonOnePlays(page),
  ];
};

/** Plays lesson 1's page in a second tab of the same browser. */
async function lessonOnePlays(page: Page) {
  const other = await page.context().newPage();
  const log = watch(other);
  const name = "lesson 1's page plays lesson 1's video";

  try {
    await other.goto(new URL('/lessons/welcome', page.url()).href, { waitUntil: 'load', timeout: 30_000 });

    const media = other.locator('video, audio').first();
    const button = other.locator(PLAY_BUTTON).first();
    const state = (property: 'readyState' | 'playing') =>
      media
        .evaluate((element, which) => {
          const target = element as HTMLMediaElement;

          return which === 'readyState' ? target.readyState > 0 : !target.paused && target.currentTime > 0.5;
        }, property)
        .catch(() => false);
    const press = () => button.click({ timeout: 15_000 }).catch(() => button.click({ force: true, timeout: 5_000 }));

    // Media that loads metadata has its player hydrated; a player that preloads nothing gets the full wait.
    await waitFor(() => state('readyState'), 10_000);
    await press();

    let playing = await waitFor(() => state('playing'), 10_000);

    // A press that landed before hydration did nothing; the media is still paused, so pressing again cannot pause it.
    if (!playing && (await media.evaluate((element) => (element as HTMLMediaElement).paused).catch(() => false))) {
      await press();
      playing = await waitFor(() => state('playing'), 15_000);
    }

    const lesson1 = log.media.some((url) => url.includes(LESSON_1));
    const lesson2 = log.media.find((url) => url.includes(LESSON_2));

    return assertion(
      name,
      playing && lesson1 && !lesson2,
      `playing=${playing} lesson 1 requested=${lesson1}${lesson2 ? ` lesson 2 requested=${lesson2}` : ''}`
    );
  } catch (error) {
    return assertion(name, false, (error as Error).message.split('\n')[0]);
  } finally {
    await other.close();
  }
}

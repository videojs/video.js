import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { parseVtt } from '../parse-vtt';

describe('parseVtt', () => {
  beforeEach(() => {
    // jsdom gives a `<track>` no text track and never loads it, so a parse stays pending until it's aborted.
    Object.defineProperty(HTMLTrackElement.prototype, 'track', {
      configurable: true,
      get: () => ({ mode: 'disabled', cues: null }),
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLTrackElement.prototype, 'track');
  });

  it('stops when aborted', async () => {
    const controller = new AbortController();
    const parsing = parseVtt('WEBVTT\n\n00:00.000 --> 00:05.000\nChapter one', 'chapters', controller.signal);

    controller.abort();

    await expect(parsing).rejects.toMatchObject({ name: 'AbortError' });
  });
});

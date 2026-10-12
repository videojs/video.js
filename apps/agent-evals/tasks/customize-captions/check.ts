import type { TaskCheck } from '../../src/grade/browser.ts';
import { allShown, assertion } from '../../src/grade/task-checks.ts';

/** An English captions track that loads its cues, and the skin's captions button, which appears only with a track. */
export const beforePlayback: TaskCheck['beforePlayback'] = async ({ page, media }) => {
  const button = await allShown(page.getByRole('button', { name: /captions|subtitles/i }));
  const tracks = await media.evaluate(async (element) => {
    const english = [...(element as HTMLMediaElement).textTracks].filter(
      (track) =>
        (track.kind === 'captions' || track.kind === 'subtitles') &&
        (/^en\b/i.test(track.language) || /english/i.test(track.label))
    );

    // A disabled track never fetches its file; hidden loads the cues without showing them.
    for (const track of english) if (track.mode === 'disabled') track.mode = 'hidden';

    for (const deadline = Date.now() + 5_000; Date.now() < deadline;) {
      if (english.some((track) => (track.cues?.length ?? 0) > 0)) break;

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return english.map((track) => ({ label: track.label, language: track.language, cues: track.cues?.length ?? 0 }));
  });
  const loaded = tracks.filter(({ cues }) => cues > 0);

  return [
    assertion(
      'English captions track',
      tracks.length > 0,
      tracks.map(({ label, language }) => `${label || '?'} (${language || '?'})`).join(', ') || 'none'
    ),
    assertion('captions load', loaded.length > 0, `${loaded[0]?.cues ?? 0} cues`),
    assertion('captions button', button.length > 0),
  ];
};

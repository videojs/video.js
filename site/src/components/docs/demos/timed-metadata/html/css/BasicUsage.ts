import '@videojs/html/video/player';
import '@videojs/html/ui/container';
import { defineTextTrack, getActiveTextCues } from '@videojs/html';

interface Note {
  title: string;
  body: string;
}

const notesTrack = defineTextTrack<Note>({ kind: 'metadata', label: 'notes' });

const player = document.querySelector('video-player');
const note = document.querySelector<HTMLElement>('.html-timed-metadata-basic__note');
const title = note?.querySelector('.html-timed-metadata-basic__title');
const body = note?.querySelector('.html-timed-metadata-basic__body');

if (player && note && title && body) {
  player.store.addTextTrack(notesTrack, {
    cues: [
      { startTime: 1, endTime: 8, value: { title: 'Timed metadata', body: 'This note is a cue the app added.' } },
      { startTime: 12, endTime: 19, value: { title: 'Any data', body: 'Each cue carries a value you render.' } },
      { startTime: 23, endTime: 30, value: { title: 'Any media', body: 'The player holds the track, not the video.' } },
    ],
  });

  player.store.subscribe(() => {
    const [cue] = getActiveTextCues(player.store, notesTrack);

    note.toggleAttribute('data-active', Boolean(cue?.value));
    title.textContent = cue?.value?.title ?? '';
    body.textContent = cue?.value?.body ?? '';
  });
}

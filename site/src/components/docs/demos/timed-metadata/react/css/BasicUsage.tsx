import { Container, defineTextTrack, type TextCueInit, useActiveTextCues, useCreateTextTrack } from '@videojs/react';
import { Video, VideoPlayer } from '@videojs/react/video';

interface Note {
  title: string;
  body: string;
}

const notesTrack = defineTextTrack<Note>({ kind: 'metadata', label: 'notes' });

const cues: TextCueInit<Note>[] = [
  { startTime: 1, endTime: 8, value: { title: 'Timed metadata', body: 'This note is a cue the app added.' } },
  { startTime: 12, endTime: 19, value: { title: 'Any data', body: 'Each cue carries a value you render.' } },
  { startTime: 23, endTime: 30, value: { title: 'Any media', body: 'The player holds the track, not the video.' } },
];

function Notes() {
  useCreateTextTrack(notesTrack, { cues });

  const [cue] = useActiveTextCues(notesTrack);
  if (!cue?.value) return null;

  return (
    <p className="react-timed-metadata-basic__note">
      <strong className="react-timed-metadata-basic__title">{cue.value.title}</strong>
      {cue.value.body}
    </p>
  );
}

export default function BasicUsage() {
  return (
    <VideoPlayer>
      <Container className="react-timed-metadata-basic__container">
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" autoPlay muted playsInline loop />
        <Notes />
      </Container>
    </VideoPlayer>
  );
}

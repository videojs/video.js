import { Container, type TextCueInit, TimeSlider, useCreateTextTrack } from '@videojs/react';
import { Video, VideoPlayer } from '@videojs/react/video';

const ads: TextCueInit[] = [{ startTime: 8 }, { startTime: 18, endTime: 24 }];

function AdsTrack() {
  useCreateTextTrack({ kind: 'metadata', label: 'ads', cues: ads });

  return null;
}

export default function BasicUsage() {
  return (
    <VideoPlayer>
      <Container className="react-time-slider-markers-basic__container">
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" autoPlay muted playsInline loop />
        <AdsTrack />
        <TimeSlider.Root className="react-time-slider-markers-basic__slider">
          <TimeSlider.Track className="react-time-slider-markers-basic__track">
            <TimeSlider.Fill className="react-time-slider-markers-basic__fill" />
          </TimeSlider.Track>
          <TimeSlider.Markers
            filter={{ label: 'ads' }}
            className="react-time-slider-markers-basic__markers"
            renderMarker={(props) => <div {...props} className="react-time-slider-markers-basic__marker" />}
          />
          <TimeSlider.Thumb className="react-time-slider-markers-basic__thumb" />
        </TimeSlider.Root>
      </Container>
    </VideoPlayer>
  );
}

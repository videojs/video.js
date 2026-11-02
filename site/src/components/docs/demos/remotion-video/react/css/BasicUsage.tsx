import { Container, createPlayer, PlayButton, TimeSlider } from '@videojs/react';
import { RemotionVideo } from '@videojs/react/media/remotion-video';
import { videoFeatures } from '@videojs/react/video';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const { Player } = createPlayer({ features: videoFeatures });

/** An ordinary Remotion composition: it reads the frame and draws, and knows nothing about Video.js. */
function Countdown() {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const secondsLeft = Math.ceil((durationInFrames - frame) / fps);

  return (
    <AbsoluteFill className="remotion-video-scene">
      <div
        className="remotion-video-count"
        style={{ opacity: interpolate(frame % fps, [0, fps / 2], [1, 0.35], { extrapolateRight: 'clamp' }) }}
      >
        {secondsLeft}
      </div>
    </AbsoluteFill>
  );
}

export default function BasicUsage() {
  return (
    <Player>
      <Container className="remotion-video-container">
        <RemotionVideo
          className="remotion-video"
          source={{
            id: 'countdown',
            composition: {
              component: Countdown,
              durationInFrames: 150,
              fps: 30,
              compositionWidth: 1280,
              compositionHeight: 720,
            },
          }}
        />

        <div className="remotion-video-controls">
          <PlayButton
            className="remotion-video-play-button"
            render={(props, state) => <button {...props}>{state.paused ? 'Play' : 'Pause'}</button>}
          />
          <TimeSlider.Root className="remotion-video-time-slider">
            <TimeSlider.Track className="remotion-video-time-slider-track">
              <TimeSlider.Fill className="remotion-video-time-slider-fill" />
            </TimeSlider.Track>
            <TimeSlider.Thumb className="remotion-video-time-slider-thumb" />
          </TimeSlider.Root>
        </div>
      </Container>
    </Player>
  );
}

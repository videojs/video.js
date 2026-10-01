import { Container, createPlayer, isMediaSourceCapable, isMediaVideoDimensionsCapable } from '@videojs/react';
import { Video, videoFeatures } from '@videojs/react/video';

const { Player, useMedia, usePlayer } = createPlayer({
  features: videoFeatures,
});

function MediaInfo() {
  const media = useMedia();

  // `useMedia` re-renders only when the media changes; subscribe to `canPlay` so the values below refresh once loaded.
  usePlayer((state) => state.canPlay);

  if (!media) return null;

  return (
    <dl className="info-panel">
      {isMediaSourceCapable(media) && (
        <div>
          <dt>src</dt>
          <dd>{media.currentSrc || '—'}</dd>
        </div>
      )}
      {isMediaVideoDimensionsCapable(media) && (
        <>
          <div>
            <dt>videoWidth</dt>
            <dd>{media.videoWidth}px</dd>
          </div>
          <div>
            <dt>videoHeight</dt>
            <dd>{media.videoHeight}px</dd>
          </div>
        </>
      )}
    </dl>
  );
}

export default function BasicUsage() {
  return (
    <Player>
      <Container className="media-container">
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" autoPlay muted playsInline loop />
        <MediaInfo />
      </Container>
    </Player>
  );
}

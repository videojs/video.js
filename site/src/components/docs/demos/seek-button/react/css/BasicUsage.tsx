import { Container, createPlayer, SeekButton } from '@videojs/react';
import { Video, videoFeatures } from '@videojs/react/video';

const { Player } = createPlayer({ features: videoFeatures });

export default function BasicUsage() {
  return (
    <Player>
      <Container className="media-container">
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" autoPlay muted playsInline loop />
        <div className="buttons">
          <SeekButton seconds={-5} className="media-seek-button">
            {'⏪'} 5s
          </SeekButton>
          <SeekButton seconds={10} className="media-seek-button">
            10s {'⏩'}
          </SeekButton>
        </div>
      </Container>
    </Player>
  );
}

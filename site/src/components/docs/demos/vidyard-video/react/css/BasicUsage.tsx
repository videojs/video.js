import { VidyardVideo } from '@videojs/react/media/vidyard-video';

export default function BasicUsage() {
  return (
    <div className="vidyard-video">
      <VidyardVideo src="{{VJS10_DEMO_VIDYARD}}" controls />
    </div>
  );
}

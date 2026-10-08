import { PlayerJsVideo } from '@videojs/react/media/playerjs-video';

export default function BasicUsage() {
  return (
    <div className="playerjs-video">
      <PlayerJsVideo src="{{VJS10_DEMO_PLAYERJS}}" controls />
    </div>
  );
}

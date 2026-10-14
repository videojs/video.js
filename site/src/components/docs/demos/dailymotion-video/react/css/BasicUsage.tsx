import { DailymotionVideo } from '@videojs/react/media/dailymotion-video';

export default function BasicUsage() {
  return (
    <div className="dailymotion-video">
      <DailymotionVideo src="{{VJS10_DEMO_DAILYMOTION}}" controls />
    </div>
  );
}

import { DailymotionVideo } from '@videojs/react/media/dailymotion-video';

export default function BasicUsage() {
  return (
    <div className="dailymotion-video">
      <DailymotionVideo muted src="{{VJS10_DEMO_DAILYMOTION}}" />
    </div>
  );
}

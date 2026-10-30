import { KalturaVideo } from '@videojs/react/media/kaltura-video';

export default function BasicUsage() {
  return <KalturaVideo className="kaltura-video" src="{{VJS10_DEMO_KALTURA}}" autoPlay muted playsInline loop />;
}

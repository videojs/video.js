import { MixcloudAudio } from '@videojs/react/media/mixcloud-audio';

export default function BasicUsage() {
  return (
    <div className="mixcloud-audio">
      <MixcloudAudio src="{{VJS10_DEMO_MIXCLOUD}}" controls />
    </div>
  );
}

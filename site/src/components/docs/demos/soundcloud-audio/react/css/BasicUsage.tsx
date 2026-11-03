import { SoundCloudAudio } from '@videojs/react/media/soundcloud-audio';

export default function BasicUsage() {
  return (
    <div className="soundcloud-audio">
      <SoundCloudAudio src="{{VJS10_DEMO_SOUNDCLOUD}}" controls />
    </div>
  );
}

import { Audio, AudioPlayer, AudioSkin } from '@videojs/react/audio';

import '@videojs/react/audio/skin.css';

export default function BasicUsage() {
  return (
    <AudioPlayer>
      <AudioSkin className="react-audio-skin-basic">
        <Audio src="{{VJS10_DEMO_AUDIO_M4A}}" crossOrigin="anonymous" />
      </AudioSkin>
    </AudioPlayer>
  );
}

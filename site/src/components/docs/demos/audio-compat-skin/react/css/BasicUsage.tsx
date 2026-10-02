import { Audio, AudioPlayer, CompatAudioSkin } from '@videojs/react/audio';

import '@videojs/react/audio/compat-skin.css';

export default function BasicUsage() {
  return (
    <AudioPlayer>
      <CompatAudioSkin className="react-audio-compat-skin-basic">
        <Audio src="{{VJS10_DEMO_AUDIO_M4A}}" crossOrigin="anonymous" />
      </CompatAudioSkin>
    </AudioPlayer>
  );
}

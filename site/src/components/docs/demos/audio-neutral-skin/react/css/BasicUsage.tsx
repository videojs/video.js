import { Audio, AudioPlayer, NeutralAudioSkin } from '@videojs/react/audio';

import '@videojs/react/audio/neutral-skin.css';

export default function BasicUsage() {
  return (
    <AudioPlayer>
      <NeutralAudioSkin className="react-audio-neutral-skin-basic">
        <Audio src="{{VJS10_DEMO_AUDIO_M4A}}" crossOrigin="anonymous" />
      </NeutralAudioSkin>
    </AudioPlayer>
  );
}

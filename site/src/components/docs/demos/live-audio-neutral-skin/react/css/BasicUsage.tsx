import { LiveAudioPlayer, NeutralLiveAudioSkin } from '@videojs/react/live-audio';
import { MuxAudio } from '@videojs/react/media/mux-audio';

import '@videojs/react/live-audio/neutral-skin.css';

export default function BasicUsage() {
  return (
    <LiveAudioPlayer>
      <NeutralLiveAudioSkin className="react-live-audio-neutral-skin-basic">
        <MuxAudio src="{{VJS10_DEMO_LIVE_HLS}}" crossOrigin="anonymous" />
      </NeutralLiveAudioSkin>
    </LiveAudioPlayer>
  );
}

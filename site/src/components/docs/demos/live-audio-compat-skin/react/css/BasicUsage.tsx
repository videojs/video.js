import { CompatLiveAudioSkin, LiveAudioPlayer } from '@videojs/react/live-audio';
import { MuxAudio } from '@videojs/react/media/mux-audio';

import '@videojs/react/live-audio/compat-skin.css';

export default function BasicUsage() {
  return (
    <LiveAudioPlayer>
      <CompatLiveAudioSkin className="react-live-audio-compat-skin-basic">
        <MuxAudio src="{{VJS10_DEMO_LIVE_HLS}}" crossOrigin="anonymous" />
      </CompatLiveAudioSkin>
    </LiveAudioPlayer>
  );
}

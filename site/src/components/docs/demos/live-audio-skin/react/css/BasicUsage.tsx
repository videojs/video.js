import { LiveAudioPlayer, LiveAudioSkin } from '@videojs/react/live-audio';
import { MuxAudio } from '@videojs/react/media/mux-audio';

import '@videojs/react/live-audio/skin.css';

export default function BasicUsage() {
  return (
    <LiveAudioPlayer>
      <LiveAudioSkin className="react-live-audio-skin-basic">
        <MuxAudio src="{{VJS10_DEMO_LIVE_HLS}}" crossOrigin="anonymous" />
      </LiveAudioSkin>
    </LiveAudioPlayer>
  );
}

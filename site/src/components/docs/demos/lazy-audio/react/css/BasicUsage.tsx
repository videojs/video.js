import { LazyAudio } from '@videojs/react/media/lazy-audio';

import './BasicUsage.css';

export default function BasicUsage() {
  return <LazyAudio className="react-lazy-audio-basic" src="{{VJS10_DEMO_AUDIO_M4A}}" controls preload="metadata" />;
}

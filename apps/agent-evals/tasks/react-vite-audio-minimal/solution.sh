#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's packaged method.
set -euo pipefail

npm install @videojs/react

cat > src/PodcastPlayer.tsx <<'TSX'
import '@videojs/react/audio/minimal-skin.css';
import { Audio, AudioPlayer, MinimalAudioSkin } from '@videojs/react/audio';

export function PodcastPlayer({ src }: { src: string }) {
  return (
    <AudioPlayer>
      <MinimalAudioSkin>
        <Audio src={src} />
      </MinimalAudioSkin>
    </AudioPlayer>
  );
}
TSX

cat > src/App.tsx <<'TSX'
import { PodcastPlayer } from './PodcastPlayer'

function App() {
  return (
    <main className="page">
      <h1>Acme Studio</h1>
      <p>Short films from independent creators.</p>
      <PodcastPlayer src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/audio.m4a" />
    </main>
  )
}

export default App
TSX

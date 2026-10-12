#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's packaged method.
set -euo pipefail

npm install @videojs/react

# 10.0.0-rc.5 renamed the minimal skin to neutral.
skin=$(node -p "/^10\\.0\\.0-(?:alpha|beta|rc\\.[1-4]$)/.test(require('./node_modules/@videojs/react/package.json').version) ? 'minimal' : 'neutral'")
Skin=${skin^}

cat > src/PodcastPlayer.tsx <<TSX
import '@videojs/react/audio/${skin}-skin.css';
import { Audio, AudioPlayer, ${Skin}AudioSkin } from '@videojs/react/audio';

export function PodcastPlayer({ src }: { src: string }) {
  return (
    <AudioPlayer>
      <${Skin}AudioSkin>
        <Audio src={src} />
      </${Skin}AudioSkin>
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

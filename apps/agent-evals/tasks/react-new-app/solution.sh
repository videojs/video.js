#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's packaged method in a new Next.js app.
set -euo pipefail

npx -y create-next-app@latest . --ts --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
npm install @videojs/react

# The starter layout's body is a flex column, so the page sets its own width rather than shrinking to its content.
cat > app/page.tsx <<'TSX'
import '@videojs/react/video/skin.css';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';

export default function Home() {
  return (
    <main style={{ width: '100%', maxWidth: '48rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: 600, marginBottom: '2rem' }}>Home</h1>
      <VideoPlayer>
        <VideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>
          <Video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsInline />
        </VideoSkin>
      </VideoPlayer>
    </main>
  );
}
TSX

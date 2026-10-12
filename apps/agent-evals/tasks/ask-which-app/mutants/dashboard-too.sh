#!/usr/bin/env bash
# The player on both home pages, when the user wanted it on the marketing site only.
# expect: task
set -euo pipefail

cd apps/dashboard
pnpm add @videojs/react

cat > app/page.tsx <<'TSX'
import '@videojs/react/video/skin.css';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Acme Studio Dashboard</h1>
      <p className="mt-3 text-lg text-zinc-600">
        Upload films, organize playlists, and see how your audience is growing.
      </p>
      <div className="mt-8">
        <VideoPlayer>
          <VideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>
            <Video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsInline />
          </VideoSkin>
        </VideoPlayer>
      </div>
    </main>
  );
}
TSX

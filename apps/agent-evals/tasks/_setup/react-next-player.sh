#!/usr/bin/env bash
# A Video.js 10 player on the react-next fixture's home page, following the installation guide's packaged method.
# The react-next-packaged oracle and the setup of every React customization task.
set -euo pipefail

src="${PLAYER_SRC:-https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4}"

pnpm add @videojs/react

mkdir -p components
cat > components/player.tsx <<'TSX'
import '@videojs/react/video/skin.css';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';

export function Player({ src }: { src: string }) {
  return (
    <VideoPlayer>
      <VideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <Video src={src} playsInline />
      </VideoSkin>
    </VideoPlayer>
  );
}
TSX

cat > app/page.tsx <<TSX
import { Player } from "@/components/player";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Acme Studio</h1>
      <p className="mt-3 text-lg text-zinc-600">
        Short films from independent creators.
      </p>
      <div className="mt-8">
        <Player src="${src}" />
      </div>
    </main>
  );
}
TSX

#!/usr/bin/env bash
# Editable skin source through shadcn, which the next Video.js upgrade does not update.
# expect: method
set -euo pipefail

pnpm dlx shadcn@latest init --base base --preset nova --yes
pnpm dlx shadcn@latest registry add '@videojs=https://shadcn.videojs.org/r/react/{name}.json'
pnpm dlx shadcn@latest add @videojs/video --overwrite --yes

cat > components/player.tsx <<'TSX'
import { Video, VideoPlayer } from '@videojs/react/video';
import { VideoSkin } from '@/components/videojs/video/skin';

export function Player({ src }: { src: string }) {
  return (
    <VideoPlayer>
      <VideoSkin className="aspect-video w-full">
        <Video src={src} playsInline />
      </VideoSkin>
    </VideoPlayer>
  );
}
TSX

#!/usr/bin/env bash
# Reference solution for the oracle agent: the packaged player wrapped in a VideoPlayer component in @acme/ui, which
# declares the Video.js dependency, and the web app's home page importing it from the package.
set -euo pipefail

pnpm --filter @acme/ui add @videojs/react

cat > packages/ui/src/video-player.tsx <<'TSX'
import "@videojs/react/video/skin.css";
import { Video, VideoPlayer as Player, VideoSkin } from "@videojs/react/video";

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

/** A Video.js player with the default skin that fills its container's width at 16:9. */
export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  return (
    <Player poster={poster}>
      <VideoSkin className={className} style={{ width: "100%", aspectRatio: "16 / 9" }}>
        <Video src={src} playsInline />
      </VideoSkin>
    </Player>
  );
}
TSX

echo 'export { VideoPlayer, type VideoPlayerProps } from "./video-player";' >> packages/ui/src/index.ts

node - <<'JS'
const { readFileSync, writeFileSync } = require('node:fs');
const file = 'apps/web/app/page.tsx';
const intro = /(\n(\s*)<p className="mt-3[^>]*>\s*Short films from independent creators\.\s*<\/p>)/;
let page = readFileSync(file, 'utf8');

if (!intro.test(page)) throw new Error('Intro text not found');

page = page
  .replace('import { Button } from "@acme/ui";', 'import { Button, VideoPlayer } from "@acme/ui";')
  .replace(
    intro,
    '$1\n$2<div className="mt-8">\n$2  <VideoPlayer src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" />\n$2</div>'
  );
writeFileSync(file, page);
JS
grep -q '<VideoPlayer src=' apps/web/app/page.tsx

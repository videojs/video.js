#!/usr/bin/env bash
# Reference solution for the oracle agent: the packaged player with the Mux media the installation guide picks for
# stream.mux.com URLs, fed from each lesson's data, and the lesson thumbnail as the player's poster.
set -euo pipefail

pnpm add @videojs/react @videojs/mux-video

mkdir -p components
cat > components/lesson-player.tsx <<'TSX'
import '@videojs/react/video/skin.css';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { VideoPlayer, VideoSkin } from '@videojs/react/video';

export function LessonPlayer({ src, poster }: { src: string; poster: string }) {
  return (
    <VideoPlayer poster={poster}>
      <VideoSkin className="rounded-lg" style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <MuxVideo src={src} playsInline />
      </VideoSkin>
    </VideoPlayer>
  );
}
TSX

node - <<'JS'
const { readFileSync, writeFileSync } = require('node:fs');
const file = 'app/lessons/[slug]/page.tsx';
const placeholder =
  /\s*\{\/\* TODO: lesson video \*\/\}\n\s*<div className="mt-6 flex aspect-video[^"]*">\s*Video coming soon\s*<\/div>/;
let page = readFileSync(file, 'utf8');

if (!placeholder.test(page)) throw new Error('Placeholder not found');

page = page
  .replace(placeholder, '\n\n      <div className="mt-6">\n        <LessonPlayer src={lesson.videoUrl} poster={lesson.thumbnailUrl} />\n      </div>')
  .replace('import { getLesson, lessons } from "@/lib/lessons";', 'import { LessonPlayer } from "@/components/lesson-player";\nimport { getLesson, lessons } from "@/lib/lessons";');
writeFileSync(file, page);
JS
grep -q '<LessonPlayer src={lesson.videoUrl}' 'app/lessons/[slug]/page.tsx'

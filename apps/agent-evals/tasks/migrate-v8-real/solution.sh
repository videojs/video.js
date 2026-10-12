#!/usr/bin/env bash
# Reference solution for the oracle agent. Video.js 10 moves the poster to the player, keeps the captions track and the
# ended event on the media, and ships a playback-rate menu (a fixed set of rates that includes 1.5). The custom control
# bar button needs the skin source in the project, added the installation guide's shadcn way, where it becomes one
# more control in the layout.
set -euo pipefail

pnpm remove video.js
rm components/VideoJS.tsx components/DownloadButton.ts

# The Video.js 8 control bar styles go with it.
node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const css = readFileSync("app/globals.css", "utf8");
writeFileSync("app/globals.css", css.replace(/\n*\.video-js \.vjs-download-button[^}]*\}\n?/, "\n"));
'

pnpm dlx shadcn@latest init --base base --preset nova --yes
pnpm dlx shadcn@latest registry add '@videojs=https://shadcn.videojs.org/r/react/{name}.json'
pnpm dlx shadcn@latest add @videojs/video --overwrite --yes

cat > components/videojs/ui/download-button.tsx <<'TSX'
'use client';

import type { ComponentProps } from 'react';

import { Button } from '@/components/videojs/ui/button';
import { cn } from '@/lib/utils';

export interface DownloadButtonProps extends Omit<ComponentProps<'button'>, 'children' | 'onClick'> {
  href: string;
}

/** Downloads the file at `href`. */
export function DownloadButton({ href, className, ...props }: DownloadButtonProps) {
  return (
    <Button
      type="button"
      aria-label="Download"
      className={cn(className)}
      onClick={() => {
        const link = document.createElement('a');

        link.href = href;
        link.download = '';
        link.click();
      }}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-media-icon drop-shadow-media-icon"
      >
        <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
      </svg>
    </Button>
  );
}
TSX

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const edit = (file, pattern, replacement) => {
  const source = readFileSync(file, "utf8");
  if (!pattern.test(source)) throw new Error(`No match for ${pattern} in ${file}`);
  writeFileSync(file, source.replace(pattern, replacement));
};
const controls = "components/videojs/video/layout/controls.tsx";
const skin = "components/videojs/video/skin.tsx";

edit(controls, /(import \{ CaptionsButton \}[^\n]*\n)/, "$1import { DownloadButton } from \"@/components/videojs/ui/download-button\";\n");
edit(controls, /(export interface DefaultVideoControlsProps \{\n)/, "$1  download?: string;\n");
edit(controls, /DefaultVideoControls\(\{ renderThumbnail \}/, "DefaultVideoControls({ download, renderThumbnail }");
edit(
  controls,
  /(\n(\s*)<VideoSettingsMenu )/,
  "\n$2{download && (\n$2  <ButtonTooltip side=\"top\">\n$2    <DownloadButton href={download} />\n$2  </ButtonTooltip>\n$2)}$1"
);
edit(skin, /(export interface VideoSkinProps[^{]*\{\n)/, "$1  download?: string;\n");
edit(skin, /VideoSkin\(\{ children, className,/, "VideoSkin({ children, className, download,");
edit(skin, /<DefaultVideoControls renderThumbnail=\{renderThumbnail\}/, "<DefaultVideoControls download={download} renderThumbnail={renderThumbnail}");
'

cat > components/FeaturedFilm.tsx <<'TSX'
'use client';

import { Video, VideoPlayer } from '@videojs/react/video';
import { useState } from 'react';

import { VideoSkin } from '@/components/videojs/video/skin';
import { featuredFilm, upNext } from '@/data/films';

export function FeaturedFilm() {
  const [ended, setEnded] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <VideoPlayer poster={featuredFilm.poster}>
        <VideoSkin className="aspect-video w-full" download={featuredFilm.download}>
          <Video
            src={featuredFilm.src}
            preload="auto"
            playsInline
            onEnded={() => setEnded(true)}
            onPlay={() => setEnded(false)}
          >
            <track kind="captions" src={featuredFilm.captions} srcLang="en" label="English" />
          </Video>
        </VideoSkin>
      </VideoPlayer>
      {ended && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-black/75 text-white">
          <p className="text-sm uppercase tracking-widest text-zinc-300">Up next</p>
          <a href={upNext.href} className="text-2xl font-semibold hover:underline">
            {upNext.title}
          </a>
        </div>
      )}
    </div>
  );
}
TSX

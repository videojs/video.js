#!/usr/bin/env bash
# A Video.js 8 player on the react-next fixture's home page, built the way the Video.js 8 React guide describes: a
# wrapper that calls videojs() in an effect, options for the poster, playback rates, and captions, a custom control bar
# button, and an overlay the page shows when the video ends.
set -euo pipefail

pnpm add video.js@8.24.1

mkdir -p components data public/captions
cp "$(dirname "$0")/../_setup/en.vtt" public/captions/en.vtt

cat > data/films.ts <<'TS'
const playbackId = "lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4";

export const featuredFilm = {
  title: "Night Swim",
  src: `https://stream.mux.com/${playbackId}/highest.mp4`,
  poster: `https://image.mux.com/${playbackId}/thumbnail.webp`,
  captions: "/captions/en.vtt",
  download: `https://stream.mux.com/${playbackId}/highest.mp4?download=night-swim`,
};

export const upNext = {
  title: "The Long Road Home",
  href: "/films/the-long-road-home",
};
TS

cat > components/VideoJS.tsx <<'TSX'
"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";

export type VideoJSOptions = Parameters<typeof videojs>[1];

interface VideoJSProps {
  options: VideoJSOptions;
  onReady?: (player: Player) => void;
}

/** The Video.js React wrapper from https://videojs.com/guides/react/. */
export function VideoJS({ options, onReady }: VideoJSProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // Make sure the Video.js player is only initialized once.
    if (!playerRef.current) {
      // The Video.js player needs to be inside the component element for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current?.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, options, () => {
        onReady?.(player);
      }));
    } else {
      const player = playerRef.current;

      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, onReady]);

  // Dispose the Video.js player when the component unmounts.
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
}
TSX

cat > components/DownloadButton.ts <<'TS'
import videojs from "video.js";
import type VjsButton from "video.js/dist/types/button";
import type Player from "video.js/dist/types/player";

const Button = videojs.getComponent("Button") as unknown as typeof VjsButton;

interface DownloadButtonOptions {
  className?: string;
  href?: string;
}

/** A control bar button that downloads the film. */
class DownloadButton extends Button {
  private href: string;

  constructor(player: Player, options: DownloadButtonOptions = {}) {
    super(player, options);
    this.href = options.href ?? "";
    this.controlText("Download");
  }

  buildCSSClass() {
    return `vjs-download-button ${super.buildCSSClass()}`;
  }

  handleClick() {
    const link = document.createElement("a");

    link.href = this.href;
    link.download = "";
    link.click();
  }
}

videojs.registerComponent("DownloadButton", DownloadButton);
TS

cat > components/FeaturedFilm.tsx <<'TSX'
"use client";

import { useCallback, useMemo, useState } from "react";
import type Player from "video.js/dist/types/player";

import { featuredFilm, upNext } from "@/data/films";

import "./DownloadButton";
import { VideoJS, type VideoJSOptions } from "./VideoJS";

export function FeaturedFilm() {
  const [ended, setEnded] = useState(false);

  const options = useMemo<VideoJSOptions>(
    () => ({
      controls: true,
      fluid: true,
      preload: "auto",
      poster: featuredFilm.poster,
      playbackRates: [0.5, 1, 1.5, 2],
      sources: [{ src: featuredFilm.src, type: "video/mp4" }],
      tracks: [{ kind: "captions", src: featuredFilm.captions, srclang: "en", label: "English" }],
    }),
    []
  );

  const handleReady = useCallback((player: Player) => {
    const controlBar = player.getChild("ControlBar");

    controlBar?.addChild("DownloadButton", { href: featuredFilm.download }, controlBar.children().length - 1);
    player.on("ended", () => setEnded(true));
    player.on("play", () => setEnded(false));
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <VideoJS options={options} onReady={handleReady} />
      {ended && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 text-white">
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

cat > app/page.tsx <<'TSX'
import { FeaturedFilm } from "@/components/FeaturedFilm";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Acme Studio</h1>
      <p className="mt-3 text-lg text-zinc-600">
        Short films from independent creators.
      </p>
      <div className="mt-8">
        <FeaturedFilm />
      </div>
    </main>
  );
}
TSX

cat >> app/globals.css <<'CSS'

.video-js .vjs-download-button .vjs-icon-placeholder::before {
  content: "\2913";
  font-size: 1.6em;
  line-height: 1.67;
}
CSS

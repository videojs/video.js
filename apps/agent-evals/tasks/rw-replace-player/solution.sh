#!/usr/bin/env bash
# Reference solution for the oracle agent: react-player removed, each card a packaged Video.js player with the Mux
# media the installation guide picks for stream.mux.com URLs, and a play on one card pausing the others.
set -euo pipefail

npm uninstall --no-audit --no-fund react-player
npm install --no-audit --no-fund @videojs/react @videojs/mux-video

cat > src/components/VideoCard.tsx <<'TSX'
import '@videojs/react/video/skin.css'
import { MuxVideo } from '@videojs/react/media/mux-video'
import { VideoPlayer, VideoSkin } from '@videojs/react/video'
import { useEffect, useRef } from 'react'

import type { Film } from '../data/films'

// Every card's media element, so starting one can pause the rest.
const cards = new Set<HTMLVideoElement>()

function pauseOthers(current: HTMLVideoElement) {
  for (const video of cards) if (video !== current) video.pause()
}

export function VideoCard({ film }: { film: Film }) {
  const media = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = media.current
    if (!video) return

    cards.add(video)

    return () => {
      cards.delete(video)
    }
  }, [])

  return (
    <article className="card">
      <div className="card-media">
        <VideoPlayer>
          <VideoSkin style={{ width: '100%', height: '100%' }}>
            <MuxVideo
              ref={media}
              src={film.src}
              playsInline
              onPlay={(event) => pauseOthers(event.currentTarget)}
            />
          </VideoSkin>
        </VideoPlayer>
      </div>
      <h2>{film.title}</h2>
      <p className="card-meta">
        {film.creator} · {film.duration}
      </p>
    </article>
  )
}
TSX

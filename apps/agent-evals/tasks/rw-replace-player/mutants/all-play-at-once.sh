#!/usr/bin/env bash
# Video.js players in every card, but starting one leaves the others playing.
# expect: task
set -euo pipefail

cat > src/components/VideoCard.tsx <<'TSX'
import '@videojs/react/video/skin.css'
import { MuxVideo } from '@videojs/react/media/mux-video'
import { VideoPlayer, VideoSkin } from '@videojs/react/video'

import type { Film } from '../data/films'

export function VideoCard({ film }: { film: Film }) {
  return (
    <article className="card">
      <div className="card-media">
        <VideoPlayer>
          <VideoSkin style={{ width: '100%', height: '100%' }}>
            <MuxVideo src={film.src} playsInline />
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

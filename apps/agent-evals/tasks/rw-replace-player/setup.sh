#!/usr/bin/env bash
# A film gallery on the react-vite fixture: six video cards played with react-player.
set -euo pipefail

npm install --no-audit --no-fund react-player@3.4.0

mkdir -p src/components src/data

cat > src/data/films.ts <<'TS'
export interface Film {
  id: string
  title: string
  creator: string
  duration: string
  src: string
}

export const films: Film[] = [
  {
    id: 'harbor-lights',
    title: 'Harbor Lights',
    creator: 'Mara Quinn',
    duration: '3:12',
    src: 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8',
  },
  {
    id: 'the-long-field',
    title: 'The Long Field',
    creator: 'Tomás Reyes',
    duration: '5:40',
    src: 'https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8',
  },
  {
    id: 'paper-birds',
    title: 'Paper Birds',
    creator: 'Aiko Tanaka',
    duration: '2:58',
    src: 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM.m3u8',
  },
  {
    id: 'night-shift',
    title: 'Night Shift',
    creator: 'Dev Patel',
    duration: '4:21',
    src: 'https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8',
  },
  {
    id: 'salt-and-stone',
    title: 'Salt and Stone',
    creator: 'Lena Fischer',
    duration: '6:05',
    src: 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8',
  },
  {
    id: 'after-the-rain',
    title: 'After the Rain',
    creator: 'Sam Okafor',
    duration: '3:47',
    src: 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM.m3u8',
  },
]
TS

cat > src/components/VideoCard.tsx <<'TSX'
import ReactPlayer from 'react-player'

import type { Film } from '../data/films'

export function VideoCard({ film }: { film: Film }) {
  return (
    <article className="card">
      <div className="card-media">
        <ReactPlayer src={film.src} controls width="100%" height="100%" />
      </div>
      <h2>{film.title}</h2>
      <p className="card-meta">
        {film.creator} · {film.duration}
      </p>
    </article>
  )
}
TSX

cat > src/App.tsx <<'TSX'
import { VideoCard } from './components/VideoCard'
import { films } from './data/films'

function App() {
  return (
    <main className="page">
      <h1>Acme Studio</h1>
      <p>Short films from independent creators.</p>
      <section className="grid" aria-label="Films">
        {films.map((film) => (
          <VideoCard key={film.id} film={film} />
        ))}
      </section>
    </main>
  )
}

export default App
TSX

perl -pi -e 's/max-width: 48rem;/max-width: 72rem;/' src/index.css

cat >> src/index.css <<'CSS'

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 2rem 1.5rem;
  margin-top: 2rem;
}

.card h2 {
  margin: 0.75rem 0 0;
  font-size: 1.125rem;
}

.card-media {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #000;
}

.card-meta {
  margin: 0.25rem 0 0;
  color: #525252;
  font-size: 0.875rem;
}
CSS

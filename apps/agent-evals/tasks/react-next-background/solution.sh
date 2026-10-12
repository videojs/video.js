#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's packaged method with the background video preset.
set -euo pipefail

pnpm add @videojs/react

# The hero sizes itself; the skin fills it from behind the heading. Inline styles, because the skin's stylesheet sits
# outside Tailwind's layers and would win over utility classes.
cat > app/page.tsx <<'TSX'
import "@videojs/react/background/skin.css";
import {
  BackgroundVideo,
  BackgroundVideoPlayer,
  BackgroundVideoSkin,
} from "@videojs/react/background";

export default function Home() {
  return (
    <main className="w-full">
      <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden bg-zinc-900">
        <BackgroundVideoPlayer>
          <BackgroundVideoSkin style={{ position: "absolute", inset: 0, zIndex: -1 }}>
            <BackgroundVideo src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" />
          </BackgroundVideoSkin>
        </BackgroundVideoPlayer>
        <div className="mx-auto w-full max-w-3xl px-6 py-16 text-white">
          <h1 className="text-4xl font-semibold tracking-tight">Acme Studio</h1>
          <p className="mt-3 text-lg text-zinc-200">
            Short films from independent creators.
          </p>
        </div>
      </section>
    </main>
  );
}
TSX

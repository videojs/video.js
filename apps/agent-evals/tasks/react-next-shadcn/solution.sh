#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's shadcn method with Tailwind styling.
set -euo pipefail

# The skin source imports `cn` from the utils that shadcn init creates, and the add installs @videojs/react at the
# version the registry names.
pnpm dlx shadcn@latest init --base base --preset nova --yes
pnpm dlx shadcn@latest registry add '@videojs=https://shadcn.videojs.org/r/react/{name}.json'
pnpm dlx shadcn@latest add @videojs/video --overwrite --yes

cat > app/page.tsx <<'TSX'
import { Video, VideoPlayer } from "@videojs/react/video";
import { VideoSkin } from "@/components/videojs/video/skin";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Acme Studio</h1>
      <p className="mt-3 text-lg text-zinc-600">
        Short films from independent creators.
      </p>
      <div className="mt-8">
        <VideoPlayer>
          <VideoSkin className="aspect-video w-full">
            <Video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsInline />
          </VideoSkin>
        </VideoPlayer>
      </div>
    </main>
  );
}
TSX

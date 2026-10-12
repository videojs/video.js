#!/usr/bin/env bash
# The player with its skin source in the repo, installed the way the react-next-shadcn oracle does, plus an English
# captions track so the captions button shows.
set -euo pipefail

tasks="$(dirname "$0")/.."

bash "$tasks/react-next-shadcn/solution.sh"

mkdir -p public/captions
cp "$tasks/_setup/en.vtt" public/captions/en.vtt

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const page = readFileSync("app/page.tsx", "utf8");
const video = /<Video (src="[^"]+") playsInline \/>/;
if (!video.test(page)) throw new Error("No <Video> in app/page.tsx");
writeFileSync(
  "app/page.tsx",
  page.replace(
    video,
    `<Video $1 playsInline>
              <track kind="captions" src="/captions/en.vtt" srcLang="en" label="English" />
            </Video>`
  )
);
'
grep -q '<track kind="captions"' app/page.tsx

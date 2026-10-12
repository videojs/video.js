#!/usr/bin/env bash
# The same player, written inside the web app with its own Video.js dependency, instead of in the shared package.
# expect: task
set -euo pipefail

mkdir -p apps/web/components
mv packages/ui/src/video-player.tsx apps/web/components/video-player.tsx
git checkout -- packages/ui/package.json packages/ui/src/index.ts pnpm-lock.yaml
pnpm --filter web add @videojs/react
perl -pi -e 's|import \{ Button, VideoPlayer \} from "\@acme/ui";|import { Button } from "\@acme/ui";\nimport { VideoPlayer } from "\@/components/video-player";|' apps/web/app/page.tsx
grep -q '@/components/video-player' apps/web/app/page.tsx

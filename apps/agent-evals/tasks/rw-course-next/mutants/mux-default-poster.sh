#!/usr/bin/env bash
# No poster set: the player falls back to the frame Mux generates, not the thumbnail the lesson data picks.
# expect: task
set -euo pipefail

perl -pi -e 's/<VideoPlayer poster=\{poster\}>/<VideoPlayer>/; s/\{ src, poster \}: \{ src: string; poster: string \}/{ src }: { src: string; poster?: string }/' components/lesson-player.tsx
! grep -q 'poster={poster}' components/lesson-player.tsx

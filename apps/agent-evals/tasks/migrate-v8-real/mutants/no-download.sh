#!/usr/bin/env bash
# Migrates everything but the custom Download button.
# expect: task
set -euo pipefail

sed -i.bak 's| download={featuredFilm.download}||' components/FeaturedFilm.tsx && rm components/FeaturedFilm.tsx.bak
! grep -q 'download=' components/FeaturedFilm.tsx

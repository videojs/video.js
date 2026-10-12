#!/usr/bin/env bash
# The brand color on the player's border only; the timeline keeps its own color.
# expect: task
set -euo pipefail

cat > app/globals.css.tmp <<'CSS'
.media-skin {
  border: 2px solid #e11d48;
}
CSS
grep -v 'media-accent-color' app/globals.css >> app/globals.css.tmp
mv app/globals.css.tmp app/globals.css

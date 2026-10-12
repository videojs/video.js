#!/usr/bin/env bash
# Every lesson page plays the first lesson's video.
# expect: source
set -euo pipefail

perl -pi -e 's/src=\{lesson\.videoUrl\}/src={lessons[0].videoUrl}/' 'app/lessons/[slug]/page.tsx'
grep -q 'src={lessons\[0\].videoUrl}' 'app/lessons/[slug]/page.tsx'

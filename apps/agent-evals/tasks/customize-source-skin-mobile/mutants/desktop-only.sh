#!/usr/bin/env bash
# Moves the captions button after the volume control, but leaves the small-screen layout as it was.
# expect: task
set -euo pipefail

git checkout -- components/videojs/video/layout/controls.tsx

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const file = "components/videojs/video/layout/controls.tsx";
let source = readFileSync(file, "utf8");
const captions = /\n(\s*)<ButtonTooltip side="top">\s*<CaptionsButton[^>]*\/>\s*<\/ButtonTooltip>/;
const block = source.match(captions)[0];
source = source.replace(block, "").replace(/(\n\s*<VolumePopover[^>]*\/>)/, `$1${block}`);
writeFileSync(file, source);
'

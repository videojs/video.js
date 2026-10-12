#!/usr/bin/env bash
# Reference solution for the oracle agent: in the controls layout of the skin source, the captions button moves right
# after the volume popover and shows at every size, and below 480 px the control row wraps with the time group on a
# row of its own above the buttons.
set -euo pipefail

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const file = "components/videojs/video/layout/controls.tsx";
let source = readFileSync(file, "utf8");
const edit = (pattern, replacement) => {
  if (!pattern.test(source)) throw new Error(`No match for ${pattern} in ${file}`);
  source = source.replace(pattern, replacement);
};

edit(/\n(\s*)<ButtonTooltip side="top">\s*<CaptionsButton[^>]*\/>\s*<\/ButtonTooltip>/, "");
edit(
  /(\n(\s*)<VolumePopover[^>]*\/>)/,
  `$1\n$2<ButtonTooltip side="top">\n$2  <CaptionsButton />\n$2</ButtonTooltip>`
);
edit(/(["\x27]absolute inset-x-2 bottom-2 z-30 flex )/, "$1max-[480px]:flex-wrap ");
edit(/(["\x27]@container\/media-time flex flex-1 )/, "$1max-[480px]:order-first max-[480px]:basis-full ");

writeFileSync(file, source);
'

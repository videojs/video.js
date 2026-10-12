#!/usr/bin/env bash
# The packaged skin with its stylesheet copied into the project for the designers to edit, which upgrades no longer
# reach.
# expect: task
set -euo pipefail

cp "$(node -p 'require.resolve("@videojs/react/video/skin.css")')" components/player.css
node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const file = "components/player.tsx";
writeFileSync(file, readFileSync(file, "utf8").replace("@videojs/react/video/skin.css", "./player.css"));
'

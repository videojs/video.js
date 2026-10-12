#!/usr/bin/env bash
# The player above the intro text instead of below it.
# expect: placement
set -euo pipefail

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const page = readFileSync("app/page.tsx", "utf8");
const player = page.match(/\n\s*<div className="mt-8">[\s\S]*?<\/div>/)[0];
writeFileSync("app/page.tsx", page.replace(player, "").replace(/(\s*)<h1/, `${player}$1<h1`));
'

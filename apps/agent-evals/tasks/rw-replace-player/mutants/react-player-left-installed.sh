#!/usr/bin/env bash
# The cards use Video.js, but react-player stays in the dependencies.
# expect: task
set -euo pipefail

npm install --no-audit --no-fund react-player@3.4.0
grep -q '"react-player"' package.json

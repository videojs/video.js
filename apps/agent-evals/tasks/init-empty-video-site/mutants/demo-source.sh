#!/usr/bin/env bash
# The docs' demo video, as an agent that never asked which film to show would use.
# expect: source
set -euo pipefail

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
writeFileSync("index.html", readFileSync("index.html", "utf8").replaceAll("lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4", "BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM"));
'

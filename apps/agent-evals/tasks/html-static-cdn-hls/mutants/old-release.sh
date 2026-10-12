#!/usr/bin/env bash
# CDN files pinned to an older release than the one under test, as a stale search result suggests.
# expect: version
set -euo pipefail

sed -i -E 's|@videojs/cdn@[0-9][^/"]*|@videojs/cdn@10.0.0-rc.2|g' index.html

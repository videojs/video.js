#!/usr/bin/env bash
# The player on the dashboard's home page instead of the marketing site's.
# expect: task
set -euo pipefail

git checkout -- apps/marketing
rm -f apps/marketing/src/player.ts
bash "$(dirname "$0")/dashboard-too.sh"

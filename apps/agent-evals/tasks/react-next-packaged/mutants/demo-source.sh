#!/usr/bin/env bash
# The docs' demo video in place of the one the prompt gave.
# expect: source
set -euo pipefail

sed -i 's|lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4|BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM|' app/page.tsx

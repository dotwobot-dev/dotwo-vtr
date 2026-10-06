#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$#" -eq 0 ]; then
  exec node "$SCRIPT_DIR/release-mac-signed.cjs" --all
fi
exec node "$SCRIPT_DIR/release-mac-signed.cjs" "$@"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$CHROME" ]; then
  echo "ERROR: no encuentro Google Chrome para renderizar assets." >&2
  exit 69
fi

render_html() {
  local input="$1"
  local output="$2"
  local width="$3"
  local height="$4"

  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --force-device-scale-factor=1 \
    "--window-size=${width},${height}" \
    "--screenshot=${output}" \
    "file://${input}" >/dev/null 2>&1
}

mkdir -p "$ROOT_DIR/build/brand" "$ROOT_DIR/build/icon.iconset"

render_html "$ROOT_DIR/build/brand/brand-source.html" "$ROOT_DIR/build/brand/dotwo-vtr-logo.png" 1800 720
render_html "$ROOT_DIR/build/brand/icon-source.html" "$ROOT_DIR/build/brand/dotwo-vtr-icon.png" 1024 1024

cp "$ROOT_DIR/build/brand/dotwo-vtr-icon.png" "$ROOT_DIR/build/icon.png"

sips -z 16 16 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_16x16.png" >/dev/null
sips -z 32 32 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_32x32.png" >/dev/null
sips -z 64 64 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_128x128.png" >/dev/null
sips -z 256 256 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_256x256.png" >/dev/null
sips -z 512 512 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$ROOT_DIR/build/icon.png" --out "$ROOT_DIR/build/icon.iconset/icon_512x512.png" >/dev/null
cp "$ROOT_DIR/build/icon.png" "$ROOT_DIR/build/icon.iconset/icon_512x512@2x.png"

iconutil -c icns "$ROOT_DIR/build/icon.iconset" -o "$ROOT_DIR/build/icon.icns"

echo "Brand assets generated:"
ls -lh \
  "$ROOT_DIR/build/brand/dotwo-vtr-logo.png" \
  "$ROOT_DIR/build/brand/dotwo-vtr-icon.png" \
  "$ROOT_DIR/build/icon.png" \
  "$ROOT_DIR/build/icon.icns"

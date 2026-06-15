#!/usr/bin/env bash
set -euo pipefail

APP_NAME="DoTwo VTR"
RELEASE_DIR="release"

mkdir -p "$RELEASE_DIR"
rm -f "$RELEASE_DIR"/*.zip

echo "==> Validando JavaScript"
npm run check

echo "==> Build Apple Silicon"
npm run pack:mac-arm64
ditto -c -k --sequesterRsrc --keepParent "dist-arm64/mac-arm64/${APP_NAME}.app" "${RELEASE_DIR}/${APP_NAME} Apple Silicon.zip"

echo "==> Build Intel moderno"
npm run pack:mac-intel
ditto -c -k --sequesterRsrc --keepParent "dist-intel/mac/${APP_NAME}.app" "${RELEASE_DIR}/${APP_NAME} Intel macOS 10.15+.zip"

echo "==> Build Intel legacy macOS 10.13"
npm run pack:mac-legacy
ditto -c -k --sequesterRsrc --keepParent "dist-legacy/mac/${APP_NAME}.app" "${RELEASE_DIR}/${APP_NAME} Legacy macOS 10.13 Intel.zip"

echo "==> ZIPs generados en ${RELEASE_DIR}/"
ls -lh "$RELEASE_DIR"/*.zip

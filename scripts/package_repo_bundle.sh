#!/usr/bin/env bash
set -euo pipefail

APP_SLUG="DoTwo_VTR"
DATE_STAMP="$(date +%F)"
BUNDLE_ROOT="dist/repo-bundle"
STAGING_DIR="${BUNDLE_ROOT}/${APP_SLUG}"
ZIP_PATH="${BUNDLE_ROOT}/${APP_SLUG}_repo_source_with_ffmpeg_${DATE_STAMP}.zip"

rm -rf "$STAGING_DIR"
mkdir -p "$BUNDLE_ROOT"

rsync -a \
  --delete \
  --exclude '.DS_Store' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude 'dist-arm64/' \
  --exclude 'dist-intel/' \
  --exclude 'dist-legacy/' \
  --exclude 'release/' \
  --exclude 'RELEASE_BETA_*/' \
  --exclude 'artifacts/' \
  --exclude 'logs/' \
  --exclude 'reports/' \
  --exclude 'test-artifacts/' \
  --exclude '*.log' \
  --exclude '*.tmp' \
  ./ "$STAGING_DIR/"

rm -f "$ZIP_PATH"
ditto -c -k --keepParent "$STAGING_DIR" "$ZIP_PATH"

echo "Repo source bundle:"
ls -lh "$ZIP_PATH"
shasum -a 256 "$ZIP_PATH"

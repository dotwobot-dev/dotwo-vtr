#!/usr/bin/env bash
set -euo pipefail

TARGETS=(
  "dist"
  "dist-arm64"
  "dist-intel"
  "dist-legacy"
  "release"
  "artifacts"
  "logs"
  "reports"
  "test-artifacts"
)

if ! command -v trash >/dev/null 2>&1; then
  echo "ERROR: macOS trash command not found. Refusing hard delete." >&2
  exit 69
fi

existing=()
for target in "${TARGETS[@]}"; do
  if [ -e "$target" ]; then
    existing+=("$target")
  fi
done

if [ "${#existing[@]}" -eq 0 ]; then
  echo "No build artifacts to clean."
  exit 0
fi

echo "Moving generated build artifacts to Trash:"
printf ' - %s\n' "${existing[@]}"
trash "${existing[@]}"

echo "Done. Kept source, docs, scripts, node_modules, and vendor/ffmpeg."

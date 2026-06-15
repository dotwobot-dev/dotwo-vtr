#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/vendor/ffmpeg"

X64_FFMPEG_URL="https://evermeet.cx/ffmpeg/getrelease/zip"
X64_FFPROBE_URL="https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip"
ARM64_FFMPEG_URL="https://ffmpeg.martin-riedl.de/redirect/latest/macos/arm64/release/ffmpeg.zip"
ARM64_FFPROBE_URL="https://ffmpeg.martin-riedl.de/redirect/latest/macos/arm64/release/ffprobe.zip"

X64_FFMPEG_SHA256="3a0ea97adddecfbf87b865da3bcbb321edfce4bab18a98ae1ba4ba9f0bd1f93a"
X64_FFPROBE_SHA256="a976306bcb8c9c50b2ac4e91f5aac4e45395e1f9063c46aecf1e1213e41c631b"
ARM64_FFMPEG_SHA256="ef4fe121377039053b0d7bed4a9aa46e7912918f5ba6424a1dd155f4eed625b0"
ARM64_FFPROBE_SHA256="3ec76ddd72068162294249465c36257d6c1add564f9b078e31e173837832967d"

for tool in curl unzip shasum; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing required tool: $tool" >&2
    exit 1
  fi
done

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

download_zip() {
  local url="$1"
  local output="$2"
  echo "Downloading $url"
  curl -L --fail --retry 3 --output "$output" "$url"
}

extract_binary() {
  local zip_file="$1"
  local binary_name="$2"
  local output_path="$3"
  local extract_dir="$TMP_DIR/extract-$binary_name-$(basename "$output_path")"

  rm -rf "$extract_dir"
  mkdir -p "$extract_dir"
  unzip -q "$zip_file" -d "$extract_dir"

  local found
  found="$(find "$extract_dir" -type f -name "$binary_name" -perm -111 | head -n 1)"
  if [[ -z "$found" ]]; then
    found="$(find "$extract_dir" -type f -name "$binary_name" | head -n 1)"
  fi
  if [[ -z "$found" ]]; then
    echo "Could not find $binary_name inside $zip_file" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$output_path")"
  cp "$found" "$output_path"
  chmod +x "$output_path"
}

verify_sha256() {
  local expected="$1"
  local file="$2"
  local actual

  actual="$(shasum -a 256 "$file" | awk '{print $1}')"
  if [[ "$actual" != "$expected" ]]; then
    echo "SHA256 mismatch for $file" >&2
    echo "Expected: $expected" >&2
    echo "Actual:   $actual" >&2
    exit 1
  fi
}

install_binary() {
  local url="$1"
  local binary_name="$2"
  local output_path="$3"
  local expected_sha="$4"
  local zip_file="$TMP_DIR/$(basename "$output_path").zip"

  download_zip "$url" "$zip_file"
  extract_binary "$zip_file" "$binary_name" "$output_path"
  verify_sha256 "$expected_sha" "$output_path"
  echo "OK: $output_path"
}

install_binary "$X64_FFMPEG_URL" "ffmpeg" "$VENDOR_DIR/darwin-x64/ffmpeg" "$X64_FFMPEG_SHA256"
install_binary "$X64_FFPROBE_URL" "ffprobe" "$VENDOR_DIR/darwin-x64/ffprobe" "$X64_FFPROBE_SHA256"
install_binary "$ARM64_FFMPEG_URL" "ffmpeg" "$VENDOR_DIR/darwin-arm64/ffmpeg" "$ARM64_FFMPEG_SHA256"
install_binary "$ARM64_FFPROBE_URL" "ffprobe" "$VENDOR_DIR/darwin-arm64/ffprobe" "$ARM64_FFPROBE_SHA256"

echo "FFmpeg/FFprobe binaries installed and verified."

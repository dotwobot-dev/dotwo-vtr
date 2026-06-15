#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

FFMPEG="${FFMPEG_BIN:-ffmpeg}"
FFPROBE="${FFPROBE_BIN:-ffprobe}"
require_cmd "$FFMPEG"
require_cmd "$FFPROBE"

if [[ $# -ne 2 ]]; then
  echo "Uso: $0 ENTRADA SALIDA.jpg" >&2
  exit 2
fi

IN="$1"
OUT="$2"
[[ -f "$IN" ]] || die "No existe el archivo: $IN"

OUT_DIR="$(dirname "$OUT")"
mkdir -p "$OUT_DIR"
TMP_OUT="$OUT_DIR/.tmp.$(basename "${OUT%.*}").$$.jpg"

VIDEO_SIZE="$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$IN" | head -1 || true)"
SRC_WIDTH="${VIDEO_SIZE%x*}"
SRC_HEIGHT="${VIDEO_SIZE#*x}"
IS_VERTICAL=0

if [[ "$SRC_WIDTH" =~ ^[0-9]+$ && "$SRC_HEIGHT" =~ ^[0-9]+$ && "$SRC_HEIGHT" -gt "$SRC_WIDTH" ]]; then
  IS_VERTICAL=1
fi

if [[ "$IS_VERTICAL" -eq 1 ]]; then
  VF='split=2[bgsrc][fgsrc];[bgsrc]scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,gblur=sigma=28:steps=2[bg];[fgsrc]scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuvj420p'
else
  VF='scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuvj420p'
fi

echo "Entrada: $IN"
echo "Salida temporal: $TMP_OUT"
echo "Salida final: $OUT"
if [[ "$IS_VERTICAL" -eq 1 ]]; then
  echo "Aviso: imagen vertical detectada; se centra sobre fondo ampliado y desenfocado."
fi

"$FFMPEG" -y -hide_banner \
  -i "$IN" \
  -vf "$VF" \
  -frames:v 1 \
  -q:v 2 \
  "$TMP_OUT"

mv "$TMP_OUT" "$OUT"
trap - EXIT

echo "OK: $OUT"

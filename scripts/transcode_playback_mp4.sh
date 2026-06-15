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
  echo "Uso: $0 ENTRADA SALIDA.mp4" >&2
  exit 2
fi

IN="$1"
OUT="$2"
[[ -f "$IN" ]] || die "No existe el archivo: $IN"

OUT_DIR="$(dirname "$OUT")"
mkdir -p "$OUT_DIR"
TMP_OUT="$OUT_DIR/.tmp.$(basename "${OUT%.*}").$$.mp4"

HAS_AUDIO="$("$FFPROBE" -v error -select_streams a:0 -show_entries stream=index -of csv=p=0 "$IN" | head -1 || true)"
VIDEO_SIZE="$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$IN" | head -1 || true)"
SRC_WIDTH="${VIDEO_SIZE%x*}"
SRC_HEIGHT="${VIDEO_SIZE#*x}"
FIELD_ORDER="$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=field_order -of csv=p=0 "$IN" | head -1 || true)"
IS_VERTICAL=0
IS_INTERLACED=0

if [[ "$SRC_WIDTH" =~ ^[0-9]+$ && "$SRC_HEIGHT" =~ ^[0-9]+$ && "$SRC_HEIGHT" -gt "$SRC_WIDTH" ]]; then
  IS_VERTICAL=1
fi

case "$FIELD_ORDER" in
  tt|bb|tb|bt) IS_INTERLACED=1 ;;
esac

make_filter() {
  local src="$1"
  local pre=""
  if [[ "$IS_INTERLACED" -eq 1 ]]; then
    pre="bwdif=mode=send_field:parity=auto:deint=all,"
  fi

  if [[ "$IS_VERTICAL" -eq 1 ]]; then
    printf '[%s]%sfps=50,split=2[bgsrc][fgsrc];[bgsrc]scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,gblur=sigma=28:steps=2[bg];[fgsrc]scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p[v]' "$src" "$pre"
  else
    printf '[%s]%sfps=50,scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v]' "$src" "$pre"
  fi
}

VIDEO_ARGS=(
  -c:v libx264
  -preset veryfast
  -profile:v high
  -level:v 4.2
  -pix_fmt yuv420p
  -b:v 8000k
  -maxrate 10000k
  -bufsize 16000k
  -g 50
  -keyint_min 50
  -tag:v avc1
)

AUDIO_ARGS=(
  -c:a aac
  -b:a 160k
  -ar 48000
  -ac 2
)

cleanup() {
  rm -f "$TMP_OUT"
}
trap cleanup EXIT

echo "Entrada: $IN"
echo "Salida temporal: $TMP_OUT"
echo "Salida final: $OUT"
echo "Perfil: MP4 H.264/AAC 1080p50"
if [[ "$IS_INTERLACED" -eq 1 ]]; then
  echo "Aviso: fuente entrelazada detectada; se desentrelaza a 50p."
fi
if [[ "$IS_VERTICAL" -eq 1 ]]; then
  echo "Aviso: video vertical detectado; se centra sobre fondo ampliado y desenfocado."
fi

if [[ -n "$HAS_AUDIO" ]]; then
  VF="$(make_filter "0:v:0")"
  "$FFMPEG" -y -hide_banner \
    -i "$IN" \
    -filter_complex "$VF" \
    -map "[v]" \
    -map 0:a:0 \
    "${VIDEO_ARGS[@]}" \
    "${AUDIO_ARGS[@]}" \
    -map_metadata -1 \
    -movflags +faststart \
    -f mp4 \
    "$TMP_OUT"
else
  VF="$(make_filter "1:v:0")"
  "$FFMPEG" -y -hide_banner \
    -f lavfi -i anullsrc=r=48000:cl=stereo \
    -i "$IN" \
    -filter_complex "$VF" \
    -map "[v]" \
    -map 0:a:0 \
    -shortest \
    "${VIDEO_ARGS[@]}" \
    "${AUDIO_ARGS[@]}" \
    -map_metadata -1 \
    -movflags +faststart \
    -f mp4 \
    "$TMP_OUT"
fi

mv "$TMP_OUT" "$OUT"
trap - EXIT

echo "OK: $OUT"

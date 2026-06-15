#!/usr/bin/env bash
set -euo pipefail

APP_NAME="DoTwo VTR"
DATE_STAMP="$(date +%F)"
STAGE_ROOT="dist/nas-staging"
STAGE_DIR="${STAGE_ROOT}/DoTwo_VTR_${DATE_STAMP}"

ARM_ZIP="dist/local-beta/${APP_NAME} Local Beta 0.1.0 Apple Silicon ${DATE_STAMP}.zip"
INTEL_ZIP="dist/local-beta/${APP_NAME} Local Beta 0.1.0 Intel macOS 10.15+ ${DATE_STAMP}.zip"
REPO_ZIP="dist/repo-bundle/DoTwo_VTR_repo_source_with_ffmpeg_${DATE_STAMP}.zip"

for file in "$ARM_ZIP" "$INTEL_ZIP" "$REPO_ZIP"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: falta $file" >&2
    echo "Genera primero: npm run beta:local:arm64 && npm run beta:local:intel && npm run repo:bundle" >&2
    exit 66
  fi
done

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

cp "$ARM_ZIP" "$STAGE_DIR/"
cp "$INTEL_ZIP" "$STAGE_DIR/"
cp "$REPO_ZIP" "$STAGE_DIR/"

cat > "$STAGE_DIR/README_DOTWO_VTR_BETA_0.1.0_${DATE_STAMP}.txt" <<README
DoTwo VTR beta 0.1.0 - entrega ${DATE_STAMP}

Contenido:

- DoTwo VTR Local Beta 0.1.0 Apple Silicon ${DATE_STAMP}.zip
  Para Macs Apple Silicon.

- DoTwo VTR Local Beta 0.1.0 Intel macOS 10.15+ ${DATE_STAMP}.zip
  Para iMac Intel moderno/actualizado.

- DoTwo_VTR_repo_source_with_ffmpeg_${DATE_STAMP}.zip
  Copia limpia del repo para compilar en otro Mac con Codex.
  Incluye vendor/ffmpeg y excluye node_modules/dist/builds.

Uso recomendado para compilar en el Mac destino:

1. Descomprimir DoTwo_VTR_repo_source_with_ffmpeg_${DATE_STAMP}.zip.
2. Entrar en la carpeta DoTwo_VTR.
3. Ejecutar:

   npm install
   npm run beta:local:arm64

   o para Intel:

   npm run beta:local:intel

Sin Developer ID y notarizacion, macOS puede mostrar avisos de Gatekeeper.
README

(
  cd "$STAGE_DIR"
  shasum -a 256 *.zip > SHA256SUMS.txt
)

echo "NAS staging preparado:"
du -sh "$STAGE_DIR"
find "$STAGE_DIR" -maxdepth 1 -type f -print

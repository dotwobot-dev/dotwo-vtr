#!/usr/bin/env bash
set -euo pipefail

APP_NAME="DoTwo VTR"
VERSION="$(node -p "require('./package.json').version")"
DATE_STAMP="$(date +%F)"
ARCH="${1:-arm64}"

case "$ARCH" in
  arm64)
    BUILD_SCRIPT="pack:mac-arm64"
    BUILD_DIR="dist-arm64"
    APP_OUT_DIR="mac-arm64"
    ARCH_LABEL="Apple Silicon"
    ;;
  x64|intel)
    ARCH="x64"
    BUILD_SCRIPT="pack:mac-intel"
    BUILD_DIR="dist-intel"
    APP_OUT_DIR="mac"
    ARCH_LABEL="Intel macOS 10.15+"
    ;;
  *)
    echo "Uso: $0 [arm64|x64]" >&2
    exit 64
    ;;
esac

SOURCE_APP="${BUILD_DIR}/${APP_OUT_DIR}/${APP_NAME}.app"
SIGNED_DIR="dist/signed-local-${ARCH}"
SIGNED_APP="${SIGNED_DIR}/${APP_NAME}.app"
PACKAGE_ROOT="dist/local-beta"
PACKAGE_NAME="${APP_NAME} Local Beta ${VERSION} ${ARCH_LABEL} ${DATE_STAMP}"
PACKAGE_DIR="${PACKAGE_ROOT}/${PACKAGE_NAME}"
ZIP_PATH="${PACKAGE_ROOT}/${PACKAGE_NAME}.zip"

echo "==> Validando JavaScript"
npm run check

echo "==> Generando build ${ARCH_LABEL}"
npm run "$BUILD_SCRIPT"

if [ ! -d "$SOURCE_APP" ]; then
  echo "ERROR: no existe ${SOURCE_APP}" >&2
  exit 66
fi

echo "==> Preparando copia limpia"
rm -rf "$SIGNED_DIR" "$PACKAGE_DIR"
mkdir -p "$SIGNED_DIR" "$PACKAGE_DIR"
ditto "$SOURCE_APP" "$SIGNED_APP"
xattr -cr "$SIGNED_APP" || true
find "$SIGNED_APP" -name _CodeSignature -type d -prune -exec rm -rf {} +

echo "==> Firmando ad-hoc para beta local"
codesign --force --deep --sign - "$SIGNED_APP"
codesign --verify --deep --strict --verbose=2 "$SIGNED_APP"

echo "==> Creando paquete local con desbloqueador"
ditto "$SIGNED_APP" "${PACKAGE_DIR}/${APP_NAME}.app"

cat > "${PACKAGE_DIR}/Abrir ${APP_NAME}.command" <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
APP="${DIR}/DoTwo VTR.app"

if [ ! -d "$APP" ]; then
  echo "No encuentro DoTwo VTR.app junto a este script."
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
fi

echo "Quitando cuarentena local de macOS..."
xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true

echo "Abriendo DoTwo VTR..."
open "$APP"
SCRIPT

chmod +x "${PACKAGE_DIR}/Abrir ${APP_NAME}.command"

cat > "${PACKAGE_DIR}/LEEME-BETA-LOCAL.txt" <<'README'
DoTwo VTR - beta local macOS

Esta beta no esta firmada con Apple Developer ID ni notarizada.

Si macOS dice "Apple no puede verificar" o "app danada", usa:

1. Descomprime este ZIP.
2. Abre "Abrir DoTwo VTR.command".
3. Si macOS bloquea tambien el script, abre Terminal en esta carpeta y ejecuta:

   xattr -dr com.apple.quarantine "DoTwo VTR.app"
   open "DoTwo VTR.app"

La distribucion final sin avisos requiere certificado Apple Developer ID y notarizacion.
README

rm -f "$ZIP_PATH"
ditto -c -k --keepParent "$PACKAGE_DIR" "$ZIP_PATH"

echo "==> Verificando ZIP"
TMP_DIR="$(mktemp -d)"
ditto -x -k "$ZIP_PATH" "$TMP_DIR"
codesign --verify --deep --strict --verbose=2 "${TMP_DIR}/${PACKAGE_NAME}/${APP_NAME}.app"
rm -rf "$TMP_DIR"

echo "==> Paquete generado"
ls -lh "$ZIP_PATH"
shasum -a 256 "$ZIP_PATH"

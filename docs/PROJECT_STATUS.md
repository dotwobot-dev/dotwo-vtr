# Project status

Fecha: 2026-06-15

## Estado

MVP inicial en desarrollo.

Implementado:

- Repo Electron independiente.
- Ventana de control.
- Ventana de salida fullscreen en pantalla elegida.
- Ingesta local estilo DoTwo Compress.
- Copia a `userData/staging`.
- Analisis con FFprobe.
- Conversion de video a `PLAYBACK.mp4`.
- Normalizacion de imagen a `STILL.jpg`.
- Playlist con estados y barras de progreso.
- Autoplay de lista, repetir lista, loop de clip.
- Duracion y efecto de imagen.
- Marcas IN/OUT por item de video durante la sesion.
- Marca e icono iniciales con gorra.
- Ronda tecnica con medios sinteticos.

Pendiente inmediato:

- Validacion real con videos grandes y formatos raros.
- Probar segundo monitor fisico.
- Probar importacion desde UI con operador humano.
- Probar build Apple Silicon en host destino.
- Probar build Intel moderno en iMac actualizado.
- Probar legacy 10.13 solo si vuelve a ser necesario.
- Pulir UX tras uso real.

## Validacion tecnica 2026-06-15

- `npm run check` OK.
- Sintaxis de scripts shell OK.
- Video H.264 720p25 -> MP4 H.264/AAC 1080p50 OK.
- Video vertical sin audio -> MP4 H.264/AAC 1080p50 OK.
- MPEG-2 entrelazado -> MP4 H.264/AAC 1080p50 OK.
- Imagen horizontal -> JPEG 1920x1080 OK.
- Imagen vertical -> JPEG 1920x1080 OK.
- `npm run pack` OK.
- App empaquetada abre y queda viva en smoke test.
- Paquete local beta Apple Silicon generado con `npm run beta:local:arm64` y
  verificado con `codesign --verify --deep --strict` tras descomprimir.
- Paquete local beta Intel macOS 10.15+ generado con `npm run beta:local:intel`
  y verificado con `codesign --verify --deep --strict` tras descomprimir.

Ver `docs/TESTING.md`.

## Paquetes beta locales 2026-06-15

Apple Silicon:

```text
dist/local-beta/DoTwo VTR Local Beta 0.1.0 Apple Silicon 2026-06-15.zip
SHA256: 74c598284799ddc60d41ecd1c16c0c4cc4a40864485674508cfbbeb0a1a8cac1
```

Intel moderno, macOS 10.15 o superior:

```text
dist/local-beta/DoTwo VTR Local Beta 0.1.0 Intel macOS 10.15+ 2026-06-15.zip
SHA256: 9e763d510db6025764bc9d0a7713f4df16708d2e1a6e0a52c10f4332192dca5e
```

Ambos paquetes incluyen un script `Abrir DoTwo VTR.command` para reducir la
friccion de Gatekeeper en betas sin Developer ID.

## Decisiones vivas

- Perfil principal: MP4 H.264/AAC 1080p50.
- App de sesion, no biblioteca persistente.
- Temporales internos recuperables solo durante sesion.
- No borrar originales.

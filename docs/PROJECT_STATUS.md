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
- Probar build Apple Silicon.
- Probar build Intel y legacy.
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

Ver `docs/TESTING.md`.

## Decisiones vivas

- Perfil principal: MP4 H.264/AAC 1080p50.
- App de sesion, no biblioteca persistente.
- Temporales internos recuperables solo durante sesion.
- No borrar originales.

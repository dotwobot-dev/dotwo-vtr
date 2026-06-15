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

Pendiente inmediato:

- Validacion real con videos grandes y formatos raros.
- Probar segundo monitor fisico.
- Probar build Apple Silicon.
- Probar build Intel y legacy.
- Pulir UX tras uso real.

## Decisiones vivas

- Perfil principal: MP4 H.264/AAC 1080p50.
- App de sesion, no biblioteca persistente.
- Temporales internos recuperables solo durante sesion.
- No borrar originales.

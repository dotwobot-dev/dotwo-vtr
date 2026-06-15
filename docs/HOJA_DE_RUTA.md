# Hoja de ruta

## Fase 1 - MVP Electron

- Crear repo.
- Portar DoTwo VTR desde Dashboard.
- Implementar control + salida.
- Implementar importacion local con FFmpeg.
- Validar `npm run check`.
- Probar en equipo real.

Estado: en curso.

## Fase 2 - Pruebas de laboratorio

- Probar videos desde pendrive/disco externo.
- Medir copia, transcodificacion y reproduccion.
- Probar imagenes grandes, HEIC, PNG y JPEG.
- Probar autoplay mixto video/imagen.
- Probar salida fullscreen en segundo monitor.
- Ajustar bitrate si 1080p50 pesa demasiado para equipos legacy.

## Fase 3 - Builds

- Apple Silicon moderna.
- Intel moderna.
- Intel legacy macOS 10.13 con Electron 26.6.10.
- ZIPs con `ditto --keepParent`.

## Fase 4 - Publicacion

- Revisar docs publicas.
- Revisar notices FFmpeg.
- Crear repo GitHub.
- Publicar primera beta.

## Fuera de MVP

- Biblioteca persistente.
- Proyectos `.dotwovtr`.
- Transiciones complejas.
- Timeline multipista.
- Nube.

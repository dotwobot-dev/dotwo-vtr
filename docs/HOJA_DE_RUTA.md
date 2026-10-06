# Hoja de ruta

## Fase 1 - MVP Electron

- Crear repo.
- Portar DoTwo VTR desde Dashboard.
- Implementar control + salida.
- Implementar importacion local con FFmpeg.
- Validar `npm run check`.
- Probar en equipo real.

Estado: beta 0.1.0 completada en junio de 2026.

## Fase 2 - Pruebas de laboratorio

- Probar videos desde pendrive/disco externo.
- Medir copia, transcodificacion y reproduccion.
- Probar imagenes grandes, HEIC, PNG y JPEG.
- Probar autoplay mixto video/imagen.
- Probar salida fullscreen en segundo monitor.
- Ajustar bitrate si 1080p50 pesa demasiado para equipos legacy.

## Fase 3 - Builds y distribucion firmada 0.2.0

- Apple Silicon moderna.
- Intel moderna.
- Intel legacy macOS 10.13 con Electron 26.6.10.
- Firma Developer ID, notarizacion y ticket de app y DMG por variante.
- ZIP verificado de la app como alternativa al DMG; sin PKG.
- Apple Silicon macOS 12+, Intel moderno macOS 10.15+, Intel legacy 10.13.

## Fase 4 - Publicacion

- Revisar docs publicas.
- Revisar notices FFmpeg.
- Repo GitHub publico creado en junio de 2026.
- Sincronizar codigo 0.2.0 sin dependencias ni artefactos pesados.
- Conservar 0.1.0 y entregar 0.2.0 en un archivo nuevo del NAS con hashes.
- Validar las dos variantes Intel en equipos fisicos antes de declarar prueba
  funcional de campo completa.

## Fuera de MVP

- Biblioteca persistente.
- Proyectos `.dotwovtr`.
- Transiciones complejas.
- Timeline multipista.
- Nube.

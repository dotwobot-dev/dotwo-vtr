# LEEME PRIMERO - DoTwo VTR

## Estado actual

Repo Electron independiente. La beta 0.1.0 esta archivada; la entrega 0.2.0
incorpora builds Developer ID/notarizados para Apple Silicon, Intel moderno
e Intel legacy macOS 10.13. Estado vivo: `docs/PROJECT_STATUS.md`.

Objetivo de producto:

- VTR local para laboratorio.
- Importacion estilo DoTwo Compress.
- Salida limpia a segundo monitor como DoTwo Teleprompter.
- Playlist con videos e imagenes.

## Ruta local

```text
/Users/dotwo/Repos/apps/DoTwo_VTR
```

## Comandos

```bash
npm install
npm run check
npm run electron
```

Para entrega firmada, consultar `docs/DISTRIBUTION.md`. `release:mac` ya no
elimina ZIPs anteriores ni genera paquetes ad-hoc.

Preparar FFmpeg local:

```bash
npm run fetch:ffmpeg
```

## Criterio

No reproducir desde origenes externos. Al cargar medios, se copian a
`userData/staging`, se analizan y se normalizan. La playlist usa los archivos
preparados dentro de la app.

No hay persistencia de proyecto todavia. Al cerrar o limpiar lista, se limpian
temporales internos. Nunca se borran originales.

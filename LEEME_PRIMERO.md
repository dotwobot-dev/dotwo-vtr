# LEEME PRIMERO - DoTwo VTR

## Estado actual

Repo inicial creado para encapsular DoTwo VTR como app Electron independiente.

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

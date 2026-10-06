# Project status

Fecha: 2026-10-06

## Estado

Beta 0.1.0 operativa y archivada. Version 0.2.0 firmada y notarizada en tres
variantes: Apple Silicon macOS 12+, Intel moderno macOS 10.15+ e Intel legacy
macOS 10.13. Los tres manifiestos estan `verified`; la validacion funcional
de campo en equipos Intel y segundo monitor fisico sigue pendiente.

Entrega 0.2.0: `release_archive/DoTwo_VTR_0.2.0_signed_20261006/` en el NAS.
Contiene DMG, PKG y ZIP por variante, manifiestos e instrucciones. Los nueve SHA-256
se recalcularon desde el NAS y coinciden. Las versiones antiguas no se han rehecho. Los binarios proceden del commit
`190b3114a86daceb53bbf27ee2eb9c135cadbcf2`.

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
- Limpieza de temporales al arrancar, limpiar lista, quitar item, cerrar ventanas
  y salir con `Cmd+Q`.
- Logo e icono definitivos de la beta, con gorra y estilo visual coherente con
  DoTwo Compress y DoTwo Teleprompter.
- Ronda tecnica con medios sinteticos.
- Captura de control documentada en `docs/assets/`.
- Flujo de backup NAS ordenado como el resto de apps DoTwo.

Pendiente inmediato:

- Validacion real con videos grandes y formatos raros.
- Probar segundo monitor fisico.
- Probar importacion desde UI con operador humano y medios reales; la prueba
  automatizada/manual con muestras sinteticas en el Mac de build ya paso.
- Probar build Intel moderno en iMac actualizado.
- Probar legacy 10.13 en el equipo real; esta variante forma parte de 0.2.0.
- Pulir UX tras uso real.

## Validacion firmada 2026-10-06

- Developer ID, hardened runtime y timestamp verificados en todos los Mach-O,
  incluidos FFmpeg y FFprobe; solo se empaqueta la arquitectura necesaria.
- App, DMG y PKG de las tres variantes: Apple `Accepted`, tickets grapados,
  Gatekeeper y app montada desde DMG comprobados.
- Los tres PKG tienen firma Developer ID Installer válida; el contenido
  extraído coincide con la app aprobada en cada variante.
- Los tres ZIP alternativos de app se extrajeron y verificaron.
- UI arm64: importacion de video e imagen, reproduccion y limpieza de staging
  al limpiar lista y salir con `Cmd+Q`; originales intactos.
- Los nueve artefactos del NAS tienen hash correcto. Ver `docs/TESTING.md`.

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
- `npm run check` OK tras endurecer limpieza de temporales en cierre/salida.

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

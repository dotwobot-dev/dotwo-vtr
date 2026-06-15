# Administracion del repo

## Ruta

```text
/Users/dotwo/Repos/apps/DoTwo_VTR
```

## No versionar

- `node_modules/`
- `dist*/`
- `release/`
- builds ZIP/DMG/PKG
- logs
- binarios FFmpeg/FFprobe descargados

## Versionar

- codigo fuente
- scripts
- docs
- assets de marca
- `package-lock.json`
- referencias de vendor sin binarios pesados

## Antes de cerrar sesion

```bash
git status --short --ignored
npm run check
```

Actualizar:

- `docs/PROJECT_STATUS.md`
- `docs/HOJA_DE_RUTA.md`

# Build matrix

## Apple Silicon — modern-arm64

```bash
npm run zip:mac-arm64
```

Target:

- Apple Silicon Macs.
- macOS 12.0 or newer (the bundled FFmpeg/FFprobe require 12.0).
- Electron 31.7.7.

## Intel moderna — modern-x64

```bash
npm run zip:mac-intel
```

Target:

- Intel Macs with macOS 10.15 or newer.
- Electron 31.7.7.

## Intel legacy macOS 10.13 — legacy-x64

```bash
npm run zip:mac-legacy
```

Target:

- Intel Macs with macOS 10.13 High Sierra.
- Electron `26.6.10`.
- FFmpeg/FFprobe x64 binaries compatible with macOS 10.13.

## Notes

- The signed release supplies a notarized DMG and a verified `.app` ZIP per
  variant. PKG is not part of this release.
- The legacy runtime's stated minimum does not replace testing on High Sierra.
- Public Git does not include generated builds.
- FFmpeg binaries are prepared with `npm run fetch:ffmpeg` and each bundle
  contains only its own architecture.

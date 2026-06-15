# Build matrix

## Apple Silicon

```bash
npm run zip:mac-arm64
```

Target:

- Apple Silicon Macs.
- Modern macOS.

## Intel moderna

```bash
npm run zip:mac-intel
```

Target:

- Intel Macs with modern macOS.

## Intel legacy macOS 10.13

```bash
npm run zip:mac-legacy
```

Target:

- Intel Macs with macOS 10.13 High Sierra.
- Electron `26.6.10`.
- FFmpeg/FFprobe x64 binaries compatible with macOS 10.13.

## Notes

- Distribute `.app` bundles as `.zip` made with `ditto --keepParent`.
- Public Git does not include generated builds.
- FFmpeg binaries are prepared with `npm run fetch:ffmpeg`.

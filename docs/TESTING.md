# Testing

## 2026-06-15 technical smoke

Validated locally:

```bash
npm run check
bash -n scripts/*.sh
```

Synthetic media generated with FFmpeg:

- H.264 720p25 with AAC audio.
- Vertical H.264 MOV without audio.
- MPEG-2 interlaced MPG.
- Wide PNG still.
- Vertical JPEG still.

Conversion results:

- Video outputs: MP4, H.264, AAC, 1920x1080, 50 fps, `yuv420p`.
- Still outputs: JPEG, 1920x1080, `yuvj420p`.

Build smoke:

```bash
npm run pack
open -n "dist/mac-arm64/DoTwo VTR.app"
```

Result:

- `dist/mac-arm64/DoTwo VTR.app` builds.
- Packaged app launches and creates Electron main/GPU/renderer processes.
- App is autocontained with FFmpeg/FFprobe resources copied from DoTwo Compress.

Known local test caveat:

- The npm-installed `node_modules/electron/dist` is incomplete in this OpenClaw
  workspace because local npm script policy blocked Electron's normal install
  flow. `electron-builder` still produces a complete packaged app using its own
  Electron download.
- For this machine, prefer `npm run pack` + packaged app for manual/e2e testing
  until the npm script policy is adjusted.

Pending:

- Human test with real lab media.
- Human test on a real second monitor.
- Legacy Intel/macOS 10.13 build and field test.

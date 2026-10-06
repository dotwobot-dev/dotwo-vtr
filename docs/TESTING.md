# Testing

## 2026-10-06 signed 0.2.0 release

- Source commit for signed binaries: `190b3114a86daceb53bbf27ee2eb9c135cadbcf2`.
- `npm run check`, shell/JavaScript syntax and Developer ID/notary preflight passed.
- Three signed candidates built with matching architecture and effective
  macOS deployment target: arm64 12.0, x64 10.15, legacy x64 10.13.
- FFmpeg/FFprobe copies inside each app signed and verified; vendor originals
  unchanged. Each app contains only the matching media-binary architecture.
- Apple accepted app and DMG submissions for every variant. Tickets were
  stapled and checked; Gatekeeper accepted the app and DMG; the app mounted
  from each DMG and extracted from each alternate ZIP passed verification.
- On this Apple Silicon Mac, bundled FFmpeg produced H.264/AAC 1920x1080 50p
  and a 1920x1080 JPEG from synthetic input. The actual packaged app imported
  and played synthetic video and image through its UI. Staging emptied after
  Clear List and after `Cmd+Q`; both original files remained intact.
- Six delivered DMG/ZIP SHA-256 hashes were checked again from the NAS.

Still requiring a human/equipment test: installation and playback on modern
Intel and macOS 10.13 Intel, real lab media, and physical second-monitor
output. Static checks and Apple notarization do not establish those results.

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

# DoTwo VTR

DoTwo VTR is a local desktop VTR-style app for audiovisual labs. It imports
videos and images, prepares local playback copies with FFmpeg, and sends a clean
output window to a second display.

## What it does

- Copies selected media into the app's local staging folder.
- Analyzes sources with FFprobe.
- Converts videos to MP4 H.264/AAC 1080p50 for reliable playback.
- Normalizes still images to 1920x1080.
- Plays a playlist of videos and images.
- Sends output to a fullscreen secondary display window.
- Supports black output, play/pause, IN/OUT marks, autoplay, repeat list, clip
  loop, image duration, and soft Ken Burns-style image effects.

## Development

```bash
npm install
npm run fetch:ffmpeg
npm run electron
```

During development, if bundled FFmpeg binaries are not present, the app tries
to use `ffmpeg` and `ffprobe` from the system PATH.

## Validation

```bash
npm run check
```

## macOS builds

```bash
npm run pack:mac-arm64
npm run pack:mac-intel
npm run pack:mac-legacy
```

The legacy build uses Electron `26.6.10` for Intel macOS 10.13.

## License

DoTwo VTR is licensed under Apache-2.0. FFmpeg and FFprobe are third-party tools
with their own licensing terms; see `THIRD_PARTY_NOTICES.md`.

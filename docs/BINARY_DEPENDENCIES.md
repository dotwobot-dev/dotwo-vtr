# Binary dependencies

DoTwo VTR uses FFmpeg and FFprobe for local media preparation.

Public Git does not include binaries. Prepare them with:

```bash
npm run fetch:ffmpeg
```

Expected layout:

```text
vendor/ffmpeg/darwin-x64/ffmpeg
vendor/ffmpeg/darwin-x64/ffprobe
vendor/ffmpeg/darwin-arm64/ffmpeg
vendor/ffmpeg/darwin-arm64/ffprobe
```

This mirrors the DoTwo Compress model. Review exact FFmpeg licensing before
distributing builds that include the binaries.

# FFmpeg vendor binaries

This folder is intentionally prepared by script instead of committing FFmpeg
and FFprobe binaries to the public repository.

Prepare local binaries with:

```bash
npm run fetch:ffmpeg
```

Expected layout:

```text
vendor/ffmpeg/darwin-arm64/ffmpeg
vendor/ffmpeg/darwin-arm64/ffprobe
vendor/ffmpeg/darwin-x64/ffmpeg
vendor/ffmpeg/darwin-x64/ffprobe
```

FFmpeg and FFprobe keep their own licenses. Review `THIRD_PARTY_NOTICES.md`
and `docs/BINARY_DEPENDENCIES.md` before distributing builds that include them.

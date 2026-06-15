# Contributing

Contributions are welcome when they keep the app practical, local-first, and
safe for audiovisual lab workflows.

Before opening a pull request:

```bash
npm ci
npm run check
```

For packaging work, fetch local FFmpeg/FFprobe binaries first:

```bash
npm run fetch:ffmpeg
```

Please avoid committing generated builds, release ZIPs, `dist/`, logs,
temporary files, media samples, or FFmpeg/FFprobe binaries.

By contributing, you agree that your contribution is licensed under the
Apache-2.0 license used by this repository.

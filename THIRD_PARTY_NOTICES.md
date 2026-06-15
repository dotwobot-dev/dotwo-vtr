# Third-party notices

DoTwo VTR is licensed under Apache-2.0. Third-party packages and external tools
keep their own licenses.

Direct npm dependencies checked for this repository:

- Electron 31.7.7: MIT license.
- electron-builder 26.8.1: MIT license.

## FFmpeg and FFprobe

FFmpeg and FFprobe are external third-party tools. They are not licensed under
this project's Apache-2.0 license.

The public repository does not version the FFmpeg/FFprobe binaries. Use
`npm run fetch:ffmpeg` to download the currently expected macOS binaries into
`vendor/ffmpeg/`.

The exact FFmpeg license can vary with the build configuration. After
downloading, inspect the bundled binaries with:

```bash
vendor/ffmpeg/darwin-arm64/ffmpeg -L
vendor/ffmpeg/darwin-x64/ffmpeg -L
```

Distribution of builds that include FFmpeg/FFprobe must comply with the
applicable FFmpeg license terms and source availability requirements.

See also:

- `vendor/ffmpeg/README.md`
- `docs/BINARY_DEPENDENCIES.md`

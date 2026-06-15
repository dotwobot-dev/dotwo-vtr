# Distribution

## Prepare dependencies

```bash
npm install
npm run fetch:ffmpeg
```

## Validate

```bash
npm run check
```

## Build release ZIPs

```bash
npm run release:mac
```

Expected output:

```text
release/DoTwo VTR Apple Silicon.zip
release/DoTwo VTR Intel macOS 10.15+.zip
release/DoTwo VTR Legacy macOS 10.13 Intel.zip
```

## Gatekeeper

Current beta builds are unsigned (`mac.identity: null`). macOS may show
Gatekeeper warnings until Developer ID signing and notarization are configured.

For local beta testing, if macOS reports that the app is damaged after copying
or downloading the ZIP on another Mac, clear the quarantine flag and open it
again:

```bash
xattr -dr com.apple.quarantine "/Applications/DoTwo VTR.app"
```

If the app is still rejected, rebuild the ZIP from an ad-hoc signed app copy and
verify the extracted bundle with `codesign --verify --deep --strict`.

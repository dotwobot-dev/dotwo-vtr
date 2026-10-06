# Distribution

## Signed release 0.2.0

Build only on the authorized Mac with its existing Developer ID Application
identity and notarization profile in the Keychain. Do not export signing
material to Git, NAS or another host. The script checks the identity, profile,
clean commit, FFmpeg binaries, architecture and minimum macOS of every Mach-O
in the final app. It signs nested code and FFmpeg/FFprobe explicitly, with
hardened runtime and timestamp.

```bash
npm ci
npm run fetch:ffmpeg
npm run check
npm run check:mac-signing
npm run build:dmg-background
npm run release:mac:signed -- --all --prepare-only
```

The last command prepares three signed candidates under `release/signed/`.
Inspect each candidate, then continue it without rebuilding:

```bash
npm run release:mac:signed -- --resume /absolute/path/to/candidate/modern-arm64
```

Use `modern-x64` and `legacy-x64` for the other variants. The script stores
Apple request IDs, hashes and state in each candidate's `manifest.json`.
If Apple is still processing, rerun `--resume` on that exact candidate;
never submit a replacement without checking the existing request. Completion
requires accepted notarizations and stapled tickets for app, DMG and PKG,
Gatekeeper checks, verification of the app inside the DMG and PKG payload,
and a verified app ZIP. `npm run release:mac` uses this same workflow.

The signed script overrides `mac.identity: null` from the old ad-hoc beta
configuration. Do not use `pack:*`, `zip:*` or `beta:local:*` as public signed
deliveries. Those older commands remain for internal testing only.

| Variant | Architecture | Electron | Minimum macOS |
| --- | --- | --- | --- |
| modern-arm64 | arm64 | 31.7.7 | 12.0 |
| modern-x64 | x86_64 | 31.7.7 | 10.15 |
| legacy-x64 | x86_64 | 26.6.10 | 10.13 |

Intel execution must be tested on real Intel machines; a successful Apple
request and static Mach-O check are not functional proof on macOS 10.13.

## NAS and source

Place DMG, PKG, app ZIP, manifest, instructions and SHA-256 sums for all three
variants in a new directory under
`/Volumes/BackUP_MacMini/DoTwo_VTR/release_archive/`. Keep the 0.1.0 beta.
Back up clean source in `repo_backups/` without `node_modules`, build output,
secrets or vendor binaries; the pinned fetch script reproduces the latter.
Update `LATEST.txt` only after every copied hash has been checked on the NAS.
Historical betas remain in their original formats; do not relabel a newly
created package as an original artifact from an older release.

Public GitHub receives source, scripts, lockfile, documentation and licenses;
it does not receive FFmpeg/FFprobe binaries, installers or other large build
output. A GitHub Release is a separate publishing decision.

## Local cleanup

After the NAS delivery is verified, `npm run clean:builds` moves generated
build output to the macOS Trash. It leaves source, dependencies and original
vendor binaries available for further work. Never use it before validating
the backup. The previous unsigned 0.1.0 workflow and its recovery helper
remain documented in the archived beta and NAS instructions, not as the
recommended distribution route.

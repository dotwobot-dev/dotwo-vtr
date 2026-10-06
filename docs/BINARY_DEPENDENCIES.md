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

Release 0.2.0 uses the same pinned binaries as the checked DoTwo Compress
distribution. The signed build copies only its target architecture into
`Contents/Resources/bin/` and signs that copy, leaving `vendor/` untouched.

| Binary | SHA-256 | Deployment target |
| --- | --- | --- |
| x64 ffmpeg | `3a0ea97adddecfbf87b865da3bcbb321edfce4bab18a98ae1ba4ba9f0bd1f93a` | macOS 10.13 |
| x64 ffprobe | `a976306bcb8c9c50b2ac4e91f5aac4e45395e1f9063c46aecf1e1213e41c631b` | macOS 10.13 |
| arm64 ffmpeg | `ef4fe121377039053b0d7bed4a9aa46e7912918f5ba6424a1dd155f4eed625b0` | macOS 12.0 |
| arm64 ffprobe | `3ec76ddd72068162294249465c36257d6c1add564f9b078e31e173837832967d` | macOS 12.0 |

The ARM binary reports GPL-3.0-or-later (`ffmpeg -L`); the release includes
the license text and upstream source/build references under
`Contents/Resources/licenses/`. The same checks and notices are required for
the x64 binaries on an Intel host. See `THIRD_PARTY_NOTICES.md`.

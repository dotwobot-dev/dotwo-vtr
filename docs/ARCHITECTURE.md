# Architecture

## Overview

```text
Electron main
  electron/main.cjs
  - windows
  - display selection
  - staging
  - FFmpeg/FFprobe
  - import state

Preload
  electron/preload.cjs
  - safe IPC bridge

Control UI
  public/index.html
  public/app.js
  public/styles.css

Display UI
  public/display.html
  public/display.js
  public/styles.css

Scripts
  scripts/transcode_playback_mp4.sh
  scripts/normalize_still.sh
  scripts/fetch_ffmpeg_macos.sh

Vendor
  vendor/ffmpeg/*
```

## Media flow

1. User selects media through Electron native dialog.
2. Main process creates an item session.
3. Original is copied to:

```text
~/Library/Application Support/dotwo-vtr/staging/<session-id>/ORIGINAL.ext
```

4. FFprobe inspects the staged copy.
5. Videos are converted to:

```text
PLAYBACK.mp4
```

6. Images are normalized to:

```text
STILL.jpg
```

7. Control and display use the prepared local file URLs.

## IPC

The renderer never receives Node integration. Public API is exposed through
`contextBridge`:

- media import
- playlist updates
- display open/close
- display state and commands
- display runtime feedback

## Display model

The control window owns playlist state. The display window receives a plain
state payload and reports runtime events such as metadata, time updates and
ended events.

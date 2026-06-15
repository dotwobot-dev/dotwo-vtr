const { app, BrowserWindow, dialog, ipcMain, screen, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");
const { pathToFileURL } = require("url");

let controlWindow;
let displayWindow;
let lastDisplayState = null;
const playlist = [];
const runningChildren = new Set();
const busyStatuses = new Set(["queued", "copying", "probing", "transcoding"]);

const VIDEO_EXTENSIONS = new Set([".avi", ".m2ts", ".m4v", ".mkv", ".mov", ".mp4", ".mpeg", ".mpg", ".mts", ".mxf", ".webm", ".wmv"]);
const IMAGE_EXTENSIONS = new Set([".bmp", ".gif", ".heic", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"]);

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

function appRoot() {
  return app.isPackaged ? process.resourcesPath : path.join(__dirname, "..");
}

function resourcePath(...parts) {
  return path.join(appRoot(), ...parts);
}

function stagingRoot() {
  return path.join(app.getPath("userData"), "staging");
}

function resolveTool(name) {
  const platformArch = process.platform === "darwin" && process.arch === "arm64"
    ? "darwin-arm64"
    : "darwin-x64";
  const candidates = [
    resourcePath("bin", platformArch, name),
    resourcePath("vendor", "ffmpeg", platformArch, name)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return name;
}

function commandEnv(extraEnv = {}) {
  return {
    ...process.env,
    PATH: [
      path.dirname(resolveTool("ffmpeg")),
      "/opt/homebrew/bin",
      "/usr/local/bin",
      "/usr/bin",
      "/bin"
    ].join(":"),
    FFMPEG_BIN: resolveTool("ffmpeg"),
    FFPROBE_BIN: resolveTool("ffprobe"),
    ...extraEnv
  };
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1220,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    title: "DoTwo VTR",
    backgroundColor: "#07090f",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  controlWindow.loadFile(path.join(__dirname, "..", "public", "index.html"));

  controlWindow.on("closed", () => {
    controlWindow = null;
    if (displayWindow) displayWindow.close();
  });
}

function getDisplays() {
  return screen.getAllDisplays().map((display, index) => ({
    id: display.id,
    index,
    label: index === 0 ? "Pantalla principal" : `Pantalla ${index + 1}`,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    size: display.size
  }));
}

async function createDisplayWindow(displayId) {
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.find(display => display.id === Number(displayId)) || displays[1] || displays[0];
  const { x, y, width, height } = targetDisplay.bounds;

  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.setBounds({ x, y, width, height });
    displayWindow.setFullScreen(true);
    displayWindow.focus();
    if (lastDisplayState) displayWindow.webContents.send("display:state", lastDisplayState);
    return true;
  }

  displayWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    fullscreen: true,
    title: "Salida DoTwo VTR",
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  displayWindow.on("closed", () => {
    displayWindow = null;
    controlWindow?.webContents.send("display:closed");
  });

  await displayWindow.loadFile(path.join(__dirname, "..", "public", "display.html"));
  if (lastDisplayState) displayWindow.webContents.send("display:state", lastDisplayState);
  return true;
}

function sendPlaylistUpdate() {
  controlWindow?.webContents.send("playlist:update", publicPlaylist());
}

function publicItem(item) {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    originalPath: item.originalPath,
    stagedPath: item.stagedPath,
    playbackPath: item.playbackPath,
    playbackUrl: item.playbackPath ? pathToFileURL(item.playbackPath).href : null,
    status: item.status,
    stage: item.stage,
    progress: item.progress,
    copiedBytes: item.copiedBytes,
    totalBytes: item.totalBytes,
    durationSeconds: item.durationSeconds,
    probeSummary: item.probeSummary,
    error: item.error,
    log: item.log.slice(-20000),
    createdAt: item.createdAt,
    readyAt: item.readyAt
  };
}

function publicPlaylist() {
  return {
    items: playlist.map(publicItem),
    busy: playlist.some(item => busyStatuses.has(item.status))
  };
}

function appendLog(item, text) {
  item.log += text;
  sendPlaylistUpdate();
}

function setItemState(item, patch) {
  Object.assign(item, patch);
  sendPlaylistUpdate();
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function mediaTypeForPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  return null;
}

function assertMediaPath(filePath) {
  const resolved = path.resolve(String(filePath || "").trim());
  if (!fs.existsSync(resolved)) throw new Error(`No existe el archivo: ${resolved}`);
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) throw new Error(`No es un archivo: ${resolved}`);
  const type = mediaTypeForPath(resolved);
  if (!type) throw new Error(`Formato no reconocido por extension: ${path.extname(resolved)}`);
  return { resolved, stat, type };
}

function createItem(filePath, stat, type) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const sessionDir = path.join(stagingRoot(), id);
  return {
    id,
    type,
    name: path.basename(filePath),
    originalPath: filePath,
    stagedPath: path.join(sessionDir, `ORIGINAL${path.extname(filePath).toLowerCase()}`),
    playbackPath: type === "video"
      ? path.join(sessionDir, "PLAYBACK.mp4")
      : path.join(sessionDir, "STILL.jpg"),
    status: "queued",
    stage: "En cola",
    progress: 0,
    copiedBytes: 0,
    totalBytes: stat.size,
    durationSeconds: null,
    probeSummary: null,
    error: null,
    log: "",
    createdAt: new Date().toISOString(),
    readyAt: null
  };
}

function trackChild(child) {
  runningChildren.add(child);
  const forget = () => runningChildren.delete(child);
  child.once("close", forget);
  child.once("error", forget);
  return child;
}

function runCapture(item, command, args) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = trackChild(spawn(command, args, {
      cwd: appRoot(),
      env: commandEnv(),
      stdio: ["ignore", "pipe", "pipe"]
    }));
    child.stdout.on("data", chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `${path.basename(command)} termino con codigo ${code}`));
    });
  });
}

function secondsFromFfmpegTime(text) {
  const matches = [...String(text).matchAll(/time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/g)];
  const last = matches.at(-1);
  if (!last) return null;
  return Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]);
}

function updateConversionProgress(item, text) {
  const seconds = secondsFromFfmpegTime(text);
  if (seconds === null || !item.durationSeconds) return;
  const progress = Math.max(1, Math.min(99, Math.round((seconds / item.durationSeconds) * 100)));
  if (progress > Number(item.progress || 0)) {
    setItemState(item, { progress });
  }
}

function runCommand(item, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = trackChild(spawn(command, args, {
      cwd: appRoot(),
      env: commandEnv(options.env),
      stdio: ["ignore", "pipe", "pipe"]
    }));
    child.stdout.on("data", chunk => {
      const text = chunk.toString();
      appendLog(item, text);
      options.onOutput?.(text);
    });
    child.stderr.on("data", chunk => {
      const text = chunk.toString();
      appendLog(item, text);
      options.onOutput?.(text);
    });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} termino con codigo ${code}`));
    });
  });
}

async function copyWithProgress(item) {
  let copiedBytes = 0;
  let lastUpdate = 0;

  setItemState(item, {
    status: "copying",
    stage: "Copiando a temporal local",
    copiedBytes: 0,
    progress: 0
  });
  appendLog(item, `Copiando a almacenamiento local de la app...\nOrigen: ${item.originalPath}\nDestino: ${item.stagedPath}\nTamano: ${formatBytes(item.totalBytes)}\n`);

  await fs.promises.mkdir(path.dirname(item.stagedPath), { recursive: true });
  const reader = fs.createReadStream(item.originalPath, { highWaterMark: 1024 * 1024 });
  reader.on("data", chunk => {
    copiedBytes += chunk.length;
    const now = Date.now();
    if (now - lastUpdate > 120 || copiedBytes === item.totalBytes) {
      lastUpdate = now;
      setItemState(item, {
        copiedBytes,
        progress: item.totalBytes > 0 ? Math.min(100, Math.round((copiedBytes / item.totalBytes) * 100)) : 100
      });
    }
  });

  await pipeline(reader, fs.createWriteStream(item.stagedPath));
  const copiedStat = await fs.promises.stat(item.stagedPath);
  if (copiedStat.size !== item.totalBytes) {
    throw new Error(`La copia no coincide en tamano (${formatBytes(copiedStat.size)} de ${formatBytes(item.totalBytes)})`);
  }
  appendLog(item, `Copia completada: ${formatBytes(item.totalBytes)}\n\n`);
}

async function probeItem(item) {
  setItemState(item, { status: "probing", stage: "Analizando con ffprobe", progress: 100 });
  appendLog(item, "Analizando copia local con ffprobe...\n");

  const json = await runCapture(item, resolveTool("ffprobe"), [
    "-v", "error",
    "-show_format",
    "-show_streams",
    "-print_format", "json",
    item.stagedPath
  ]);
  const probe = JSON.parse(json);
  const video = (probe.streams || []).find(stream => stream.codec_type === "video") || {};
  const duration = Number(probe.format?.duration || video.duration || 0);
  const width = Number(video.width || 0);
  const height = Number(video.height || 0);
  const codec = video.codec_name || (item.type === "image" ? "imagen" : "desconocido");

  setItemState(item, {
    durationSeconds: duration > 0 ? duration : null,
    probeSummary: {
      codec,
      size: width && height ? `${width}x${height}` : "desconocido",
      duration: duration > 0 ? `${duration.toFixed(2)} s` : item.type === "image" ? "imagen fija" : "desconocida"
    }
  });
  appendLog(item, `OK ffprobe\nTipo: ${item.type}\nCodec: ${codec}\nTamano: ${width || "?"}x${height || "?"}\nDuracion: ${duration > 0 ? `${duration.toFixed(2)} s` : "n/a"}\n\n`);
}

async function transcodeItem(item) {
  setItemState(item, {
    status: "transcoding",
    stage: item.type === "video" ? "Convirtiendo a MP4 1080p50" : "Normalizando imagen 16:9",
    progress: 0
  });

  const script = item.type === "video"
    ? resourcePath("scripts", "transcode_playback_mp4.sh")
    : resourcePath("scripts", "normalize_still.sh");

  appendLog(item, `Preparando formato de reproduccion...\nScript: ${script}\nSalida: ${item.playbackPath}\n`);
  await runCommand(
    item,
    script,
    [item.stagedPath, item.playbackPath],
    { onOutput: text => updateConversionProgress(item, text) }
  );

  setItemState(item, {
    status: "ready",
    stage: "Listo",
    progress: 100,
    readyAt: new Date().toISOString()
  });
  appendLog(item, "Item listo para VTR.\n\n");
}

async function importOne(filePath) {
  const { resolved, stat, type } = assertMediaPath(filePath);
  const item = createItem(resolved, stat, type);
  playlist.push(item);
  sendPlaylistUpdate();

  try {
    await copyWithProgress(item);
    await probeItem(item);
    await transcodeItem(item);
  } catch (error) {
    setItemState(item, {
      status: "error",
      stage: "Error",
      error: error.message,
      progress: 0
    });
    appendLog(item, `ERROR: ${error.message}\n`);
  }

  return publicItem(item);
}

async function importMedia(paths) {
  const inputPaths = Array.isArray(paths) ? paths : [paths];
  const results = [];
  for (const filePath of inputPaths.filter(Boolean)) {
    results.push(await importOne(filePath));
  }
  return { items: results, playlist: publicPlaylist() };
}

async function pickMediaFiles() {
  const result = await dialog.showOpenDialog(controlWindow, {
    title: "Cargar medios DoTwo VTR",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Imagenes y videos", extensions: [...VIDEO_EXTENSIONS, ...IMAGE_EXTENSIONS].map(ext => ext.slice(1)) },
      { name: "Videos", extensions: [...VIDEO_EXTENSIONS].map(ext => ext.slice(1)) },
      { name: "Imagenes", extensions: [...IMAGE_EXTENSIONS].map(ext => ext.slice(1)) },
      { name: "Todos los archivos", extensions: ["*"] }
    ]
  });

  if (result.canceled) return [];
  return result.filePaths;
}

async function clearPlaylist() {
  if (playlist.some(item => busyStatuses.has(item.status))) {
    throw new Error("Espera a que termine la importacion antes de limpiar la lista");
  }
  playlist.splice(0, playlist.length);
  await resetStagingRoot();
  sendPlaylistUpdate();
  return publicPlaylist();
}

async function removeItem(id) {
  const index = playlist.findIndex(item => item.id === id);
  if (index === -1) return publicPlaylist();
  const [item] = playlist.splice(index, 1);
  await fs.promises.rm(path.dirname(item.stagedPath), { recursive: true, force: true });
  sendPlaylistUpdate();
  return publicPlaylist();
}

function revealItem(id) {
  const item = playlist.find(entry => entry.id === id);
  if (!item?.playbackPath) return false;
  shell.showItemInFolder(item.playbackPath);
  return true;
}

async function resetStagingRoot() {
  await fs.promises.rm(stagingRoot(), { recursive: true, force: true });
  await fs.promises.mkdir(stagingRoot(), { recursive: true });
}

function terminateRunningChildren() {
  for (const child of [...runningChildren]) {
    try {
      child.kill("SIGTERM");
    } catch {
      // The process may have already exited.
    }
  }
  runningChildren.clear();
}

app.whenReady().then(async () => {
  await resetStagingRoot();
  createControlWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow();
  });
});

app.on("before-quit", () => {
  terminateRunningChildren();
});

app.on("window-all-closed", async () => {
  terminateRunningChildren();
  await resetStagingRoot().catch(() => {});
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (controlWindow) {
    if (controlWindow.isMinimized()) controlWindow.restore();
    controlWindow.focus();
  }
});

ipcMain.handle("app:diagnostics", () => ({
  version: app.getVersion(),
  userData: app.getPath("userData"),
  stagingRoot: stagingRoot(),
  ffmpegPath: resolveTool("ffmpeg"),
  ffprobePath: resolveTool("ffprobe"),
  hasBundledFfmpeg: fs.existsSync(resolveTool("ffmpeg")) && path.isAbsolute(resolveTool("ffmpeg"))
}));

ipcMain.handle("screens:list", () => getDisplays());
ipcMain.handle("media:pick", () => pickMediaFiles());
ipcMain.handle("media:import", (_event, paths) => importMedia(paths));
ipcMain.handle("playlist:clear", () => clearPlaylist());
ipcMain.handle("playlist:remove", (_event, id) => removeItem(id));
ipcMain.handle("playlist:reveal", (_event, id) => revealItem(id));
ipcMain.handle("display:open", (_event, displayId) => createDisplayWindow(displayId));
ipcMain.handle("display:close", () => {
  if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close();
  return true;
});

ipcMain.on("display:state", (_event, state) => {
  lastDisplayState = state;
  displayWindow?.webContents.send("display:state", state);
});

ipcMain.on("display:command", (_event, command) => {
  displayWindow?.webContents.send("display:command", command);
});

ipcMain.on("display:ready", () => {
  if (lastDisplayState) displayWindow?.webContents.send("display:state", lastDisplayState);
});

ipcMain.on("display:runtime", (_event, runtime) => {
  controlWindow?.webContents.send("display:runtime", runtime);
});

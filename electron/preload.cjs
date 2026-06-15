const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vtr", {
  diagnostics: () => ipcRenderer.invoke("app:diagnostics"),
  listScreens: () => ipcRenderer.invoke("screens:list"),
  pickMediaFiles: () => ipcRenderer.invoke("media:pick"),
  importMedia: paths => ipcRenderer.invoke("media:import", paths),
  clearPlaylist: () => ipcRenderer.invoke("playlist:clear"),
  removeItem: id => ipcRenderer.invoke("playlist:remove", id),
  revealItem: id => ipcRenderer.invoke("playlist:reveal", id),
  openDisplay: displayId => ipcRenderer.invoke("display:open", displayId),
  closeDisplay: () => ipcRenderer.invoke("display:close"),
  setDisplayState: state => ipcRenderer.send("display:state", state),
  sendDisplayCommand: command => ipcRenderer.send("display:command", command),
  onPlaylistUpdate: callback => {
    const listener = (_event, playlist) => callback(playlist);
    ipcRenderer.on("playlist:update", listener);
    return () => ipcRenderer.removeListener("playlist:update", listener);
  },
  onDisplayClosed: callback => {
    const listener = () => callback();
    ipcRenderer.on("display:closed", listener);
    return () => ipcRenderer.removeListener("display:closed", listener);
  },
  onDisplayRuntime: callback => {
    const listener = (_event, runtime) => callback(runtime);
    ipcRenderer.on("display:runtime", listener);
    return () => ipcRenderer.removeListener("display:runtime", listener);
  }
});

contextBridge.exposeInMainWorld("vtrDisplay", {
  ready: () => ipcRenderer.send("display:ready"),
  runtime: runtime => ipcRenderer.send("display:runtime", runtime),
  onState: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("display:state", listener);
    return () => ipcRenderer.removeListener("display:state", listener);
  },
  onCommand: callback => {
    const listener = (_event, command) => callback(command);
    ipcRenderer.on("display:command", listener);
    return () => ipcRenderer.removeListener("display:command", listener);
  }
});

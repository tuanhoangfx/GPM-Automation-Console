const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gpm", {
  request: (channel, payload) => ipcRenderer.invoke(channel, payload)
});

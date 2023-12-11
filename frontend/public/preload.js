// public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  runCommand: (command) => ipcRenderer.send('run-command', command),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});
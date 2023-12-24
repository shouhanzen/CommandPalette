// public/preload.js
const { contextBridge, ipcRenderer, ipcMain } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  runCommand: (command) => ipcRenderer.send('run-command', command),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  
  resetSearch: (func) => ipcRenderer.on('reset-search', func),
  onNewCommands: (func) => ipcRenderer.on('new-commands', func),
  onCmdFollowup: (func) => ipcRenderer.on('cmd-followup', func),

  retrieveMRU: () => ipcRenderer.invoke('retrieve-mru'),
  onMRUChange: (func) => ipcRenderer.on('mru-change', func),
});
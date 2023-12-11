// public/preload.js
const { contextBridge, ipcRenderer, ipcMain } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  runCommand: (command) => ipcRenderer.send('run-command', command),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  
  setSearchTerm: (term) => ipcRenderer.on('set-search-term', term),
});
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');

function registerShortcut(shortcut, callback) {
   // Register a global shortcut listener.
   const ret = globalShortcut.register(shortcut, callback);

  if (!ret) {
    console.log('Registration failed');
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered(shortcut));
}

function unregisterShortcut(shortcut) {
  globalShortcut.unregister(shortcut);
}

module.exports = { registerShortcut, unregisterShortcut };
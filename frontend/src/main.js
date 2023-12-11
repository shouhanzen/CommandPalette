const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');

// Keep a global reference of the window object to avoid it being garbage collected.
let win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    // width: 800,
    // height: 600,
    // show: false, // Initially hide the window

    frame: false, // Make the window frameless
    transparent: true, // Make the window transparent

    webPreferences: {
      preload: path.join(__dirname, '../public/preload.js'),
      // other options
    },
  });

  // Load next js app
  const startUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;

  win.loadURL(startUrl);
  win.on('closed', () => win = null);

  // Maximize the window to take up the whole screen
  win.maximize();
}

function toggleWindow() {
  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
  }
}

app.whenReady().then(() => {
  createWindow()

  // Register a global shortcut listener.
  const ret = globalShortcut.register('Ctrl+Shift+Alt+I', () => {
    toggleWindow();
  });

  if (!ret) {
    console.log('Registration failed');
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('Ctrl+Shift+I'));
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // Unregister the global shortcut listener.
  globalShortcut.unregisterAll();

  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('minimize-app', () => {
  toggleWindow();
});

// src/main.js
ipcMain.on('run-command', (event, command) => {

  // Hide the window
  toggleWindow();

  // Run the command here
  console.log('Running command:', command);
});
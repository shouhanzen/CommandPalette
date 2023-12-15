const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const commands = require('./commands');
const cmdMRU = require('./cmd_mru');

// Keep a global reference of the window object to avoid it being garbage collected.
let win;
const SHORTCUT = 'Ctrl+Shift+Alt+P';

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    // width: 800,
    // height: 600,
    // show: false, // Initially hide the window

    frame: false, // Make the window frameless
    transparent: true, // Make the window transparent
    resizable: false, // Disable resizing of the window
    show: false, // Initially hide the window

    webPreferences: {
      preload: path.join(__dirname, '../public/preload.js'),
      // other options
    },
  });

  // Load next js app
  const startUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;

  win.loadURL(startUrl);
  win.on('closed', () => win = null);
  win.on('blur', () => {
    win.hide();
  });

  // Maximize the window to take up the whole screen
  win.maximize();
}

function toggleWindow() {
  if (win.isVisible()) {
    win.blur();
    win.hide();
  } else {
    win.show();
    resetSearch();
  }
}

app.whenReady().then(() => {
  createWindow()

  // Register a global shortcut listener.
  const ret = globalShortcut.register(SHORTCUT, () => {
    toggleWindow();
  });

  if (!ret) {
    console.log('Registration failed');
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered(SHORTCUT));
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

ipcMain.on('run-command', async (event, command) => {

  if (command.closes_palette === false) {
    resetSearch();
  }
  else {
    // Hide the window
    toggleWindow();
  }

  // Update the MRU list
  // Send the updated MRU list to the renderer
  let mru = cmdMRU.update_cmd_MRU(command);
  win.webContents.send('mru-change', mru);

  commands.runCommand(command, win, app);
});

// Pings a series of command contributors
ipcMain.handle('get-commands', async () => {
  return commands.get_commands();
});

function resetSearch(term) {
  win.webContents.send('reset-search', term);
}
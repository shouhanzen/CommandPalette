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

const SHORTCUT = 'Ctrl+Shift+Alt+P';

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
  // Hide the window
  toggleWindow();

  // Check the issuer of the command
  if (command.issuer === 'uvicorn') {
    // If the issuer is uvicorn, post the command to the uvicorn server
    try {
      const response = await fetch('http://127.0.0.1:8000/run-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
      const result = await response.json();
      console.log('Command result:', result);
    } catch (err) {
      console.error('Error running command:', err);
    }
  } else {
    // If the issuer is not uvicorn, run the command here
    console.log('Running command:', command);
  }
});

// Pings a series of command contributors
ipcMain.handle('get-commands', async () => {
  // Replace this with your actual commands data
  const commands_data = [
    { title: "reload", description: "Reloads Window", command: "commands.reload()", issuer: "electron" },
  ];

  try {
    // Also get commands from uvicorn server
    const response = await fetch('http://127.0.0.1:8000/commands');
    const python_commands = await response.json();
    commands_data.push(...python_commands);
  } catch (err) {
    console.error(err);
  }

  return commands_data;
});
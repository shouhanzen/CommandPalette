const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const commands = require('./commands');
const cmdMRU = require('./cmd_mru');

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

  // Update the MRU list
  // Send the updated MRU list to the renderer
  mru = cmdMRU.update_cmd_MRU(command);
  win.webContents.send('mru-change', mru);

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

    // Run the command
    // First, match the original command
    original_cmd = commands.commands_data.find((cmd) => cmd.title === command.title);
    console.log('Original command:', original_cmd);

    if (original_cmd) {
      // If the original command is found, run it
      original_cmd.command(win);
    } else {
      // Raise exception
      throw `Command not found: ${command.title}`;
    }
  }
});

// Pings a series of command contributors
ipcMain.handle('get-commands', async () => {
  // Replace this with your actual commands data
  let commands_data = [];
  
  // Strip out the commands from the commands data
  for (command in commands.commands_data) {
    let cmd = {... commands.commands_data[command]};
    delete cmd['command'];
    commands_data.push(cmd);
  }

  try {
    // Also get commands from uvicorn server
    const response = await fetch('http://127.0.0.1:8000/commands');
    const python_commands = await response.json();
    commands_data.push(...python_commands);
  } catch (err) {
    console.error(err);
  }

  // Check that commands all have unique titles
  let titles = new Set();
  for (command in commands_data) {
    let title = commands_data[command].title;
    if (titles.has(title)) {
      console.error(`Duplicate command title: ${title}`);
    }
    titles.add(title);
  }

  return commands_data;
});

ipcMain.handle('retrieve-mru', () => {
  return cmdMRU.mru;
});

function resetSearch(term) {
  win.webContents.send('reset-search', term);
}
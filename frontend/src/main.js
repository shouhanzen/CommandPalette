const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const serve = require("electron-serve");
const log = require('electron-log');
const path = require('path');
const commands = require('./commands');
const cmdMRU = require('./cmd_mru');
const config = require('./config');
const { screen } = require('electron');
const { registerShortcut, unregisterShortcut } = require('./shortcuts');


const portfinder = require('portfinder');
const { exec, spawn, execFile } = require('child_process');
const Logger = require('electron-log');

// Set log level
log.initialize({ preload: true });
log.level = 'debug';

// In the main process, catch all unhandled errors and log them
process.on('uncaughtException', (error) => {
  log.error(`Unhandled Exception: ${error}`);
});

// Keep a global reference of the window object to avoid it being garbage collected.
let win;
const SHORTCUT = (data) => {
  if (process.platform == "win32") return data.shortcuts.win_open;
  if (process.platform == "darwin") return data.shortcuts.mac_open;
  return 'Unknown OS';
};
let backendProcess = null;

const appServe = app.isPackaged ? serve({
  directory: path.join(__dirname, "../out")
}) : null;

function createWindow() {
  
  // Create the browser window.
  win = new BrowserWindow({
    frame: false, // Make the window frameless
    transparent: true, // Make the window transparent
    resizable: false, // Disable resizing of the window
    // show: false, // Initially hide the window

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },

    icon: path.join(__dirname, 'palette.ico'),
  });

  // https://medium.com/@rbfraphael/building-desktop-apps-with-electron-next-js-without-nextron-01bbf1fdd72e
  if (app.isPackaged) {
    appServe(win).then(() => {
      win.loadURL("app://-");
    });
  } else {
    win.loadURL("http://localhost:3000");
    // win.webContents.openDevTools();
    win.webContents.on("did-fail-load", (e, code, desc) => {
      console.log("Failed to load app:", code, desc);

      win.webContents.reloadIgnoringCache();
    });
  }

  // Start python backend
  tryStartBackend(win);

  // win.loadURL(startUrl);
  win.on('closed', () => win = null);
  win.on('blur', () => {
    win.hide();
  });
  win.onerror = (error) => {
    log.error(`Window error: ${error}`);
  }

  // Prevent the window title from being updated
  win.webContents.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  // Maximize the window to take up the whole screen
  win.maximize();
}

async function tryStartBackend(win) {
  log.info("Starting backend");

  let portUsed = 8000;

  // Check if "spawn-backend" argument was passed
  let spawn_backend = process.argv.includes("--spawn-backend") || app.isPackaged;
  if (spawn_backend) {

    log.info ("Spawning backend, using portfinder to find open port");

    await portfinder.getPortPromise({
      port: 21410,    // minimum port
      stopPort: 30000 // maximum port
    }).then((port) => {
      portUsed = port;

      // Construct the full path to the executable
      let root = path.join(app.getAppPath(), "..", "..");
      let backend_executable = "backend_0p1.exe";

      if (process.platform == "darwin")
        backend_executable = path.join(".", "backend_0p1");

      let backendPath = path.join(backend_executable); // Use double backslashes for Windows paths

      // If in a devmode test, use the devmode backend
      if (!app.isPackaged) {
        root = path.join(app.getAppPath(), "..");
        backendPath = path.join("dist", "backend_0p1", backend_executable); // Use double backslashes for Windows paths
      }
      
      // Use execFile
      // Define the backend executable and the arguments
      const args = ['--port', portUsed.toString()];
      // const command = backendPath + " " + args.join(" ");

      // Define the options, including the working directory
      const options = { cwd: path.join(root, "backend") };

      
      log.info(`Backend path: ${backendPath}`)
      log.info(`Backend port: ${portUsed}`)

      // Use execFile to run the backend executable
      // Use spawn to run the backend executable
      const backendProcess = spawn(backendPath, args, options);

      // Handle the stdout, stderr, and error events
      backendProcess.stdout.on('data', (data) => {
        log.info(`stdout: ${data}`);
      });

      backendProcess.stderr.on('data', (data) => {
        log.error(`stderr: ${data}`);
      });

      backendProcess.on('error', (error) => {
        log.error(`spawn error: ${error}`);
      });

      backendProcess.on('close', (code) => {
        log.info(`child process exited with code ${code}`);
      });

      log.info(`Backend process PID: ${backendProcess.pid}`)

    }).catch((error) => {
      log.error(`Error finding open port: ${error}`);
    });
  }

  // Add backend as issuer
  commands.register_issuer({
    name: "Backend",
    url: `http://127.0.0.1:${portUsed}`,
  }, win);
}

function moveToActiveMonitor(win) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const activeDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  
  const { x, y, width, height } = activeDisplay.bounds;
  win.setBounds({ x, y, width, height });
  win.focus();
}

function toggleWindow() {
  if (win.isVisible()) {
    win.blur();
    win.hide();
  } else {

    // Move the window to the active monitor
    moveToActiveMonitor(win);
    win.show();

    resetSearch();
  }
}

app.whenReady().then(() => {
  createWindow()

  // Register a global shortcut listener.
  registerShortcut(SHORTCUT(config.getData()), () => {
    toggleWindow();
  });

  config.onConfigChange((data, new_data) => {
    log.info("Shortcut changed");

    unregisterShortcut(SHORTCUT(data));
    registerShortcut(SHORTCUT(new_data), () => {
      toggleWindow();
    });
  });
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

app.on('quit', () => {
  // Terminate the backend process when the app is about to close
  log.info("Sending client quit signal to backends");
  for (const issuer of commands.get_issuers()) {
    endpoint = path.join(issuer.url, 'quit');
    log.info(`Sending quit signal to ${endpoint}`);
    fetch(endpoint, { method: 'POST' })
      .then(response => response.text())
      .then(text => log.info(text))
      .catch(error => log.error(error));
  }
});

app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,
  path: app.getPath('exe'),
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
ipcMain.handle('clear-commands-cache', async () => {
  return commands.clear_cache();
});

ipcMain.handle('get-commands-cached', async () => {
  return commands.get_commands_cached();
});

ipcMain.on('save-settings', (event, settings) => {
  config.saveConfig(settings);
});

ipcMain.handle('get-settings', async () => {
  return config.getData();
});

function resetSearch(term) {
  win.webContents.send('reset-search', term);
}
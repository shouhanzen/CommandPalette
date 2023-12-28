const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const serve = require("electron-serve");
const log = require('electron-log');
const path = require('path');
const commands = require('./commands');
const cmdMRU = require('./cmd_mru');
const { screen } = require('electron');


const portfinder = require('portfinder');
const { exec, spawn, execFile } = require('child_process');

// Set log level
log.initialize({ preload: true });
log.level = 'debug';

// In the main process, catch all unhandled errors and log them
process.on('uncaughtException', (error) => {
  log.error(`Unhandled Exception: ${error}`);
});

// Keep a global reference of the window object to avoid it being garbage collected.
let win;
const SHORTCUT = () => {
  if (process.platform == "win32") return 'Ctrl+Shift+Alt+P';
  if (process.platform == "darwin") return 'Option+Shift+P';
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

  // Maximize the window to take up the whole screen
  win.maximize();
}

function tryStartBackend(win) {
  log.info("Starting backend");

  let portUsed = 8000;

  if (app.isPackaged) {

    portfinder.getPort(async (err, port) => {
      if (err) {
        console.error("Error finding open port:", err);
        return;
      }
      portUsed = port;

      // Construct the full path to the executable
      let backendPath = "";

      let root = path.join(app.getAppPath(), "..", "..");
      backendPath = path.join(root, "backend", "backend_0p1.exe"); // Use double backslashes for Windows paths

      // Use execFile
      // Define the backend executable and the arguments
      const backendExecutable = backendPath; // Make sure this is just the executable name or path
      const args = ['--port', portUsed.toString()];

      // Define the options, including the working directory
      const options = { cwd: path.join(root, "backend") };

      // Use execFile to run the backend executable
      backendProcess = execFile(backendExecutable, args, options, (error, stdout, stderr) => {
        if (error) {
          log.error(`execFile error: ${error}`);
          return;
        }
        log.info(`stdout: ${stdout}`);
        if (stderr) {
          log.error(`stderr: ${stderr}`);
        }
      });

      log.info(`Backend path: ${backendPath}`)
      log.info(`Backend port: ${portUsed}`)
      log.info(`Backend process PID: ${backendProcess.pid}`)

    })
  }

  // We are in dev mode, use spawn
  else {
    // Yeah I can't figure this out
    log.debug("INFO: Running in dev mode, please spawn uvicorn server manually")

    // const root = path.join(app.getAppPath(), "..", "backend");
    // backendPath = path.join(root, "entry.py"); // Use double backslashes for Windows paths
    // const command = `uvicorn`
    // const args = [`src.main:app`, `--port`, port, `--reload`];

    // // Use spawn to run the backend executable
    // backendProcess = spawn(command, args, { shell: true, cwd: root  });

    // // Log the stdout and stderr
    // backendProcess.stdout.on('data', (data) => {
    //   log.info(`stdout: ${data}`);
    // });

    // backendProcess.stderr.on('data', (data) => {
    //   log.error(`stderr: ${data}`);
    // });

    // backendProcess.on('close', (code) => {
    //   log.info(`Backend process exited with code ${code}`);
    // });
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
  const ret = globalShortcut.register(SHORTCUT(), () => {
    toggleWindow();
  });

  if (!ret) {
    console.log('Registration failed');
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered(SHORTCUT()));
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

  // Kill the backend process
  // if (backendProcess) {
  //   log.info("Killing backend process");
  //   log.info("Backend process PID: " + backendProcess.pid);
  //   backendProcess.kill();
  // }
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
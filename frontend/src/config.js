const path = require('path');
const { app } = require('electron');
const fs = require('fs');

function loadConfig() {
  const configPath = path.join(app.getPath('userData'), 'config.json');

  // If config file doesn't exist, create it
    if (!fs.existsSync(configPath)) {
        console.log("Creating config file");
        fs.writeFileSync(configPath, JSON.stringify({
            shortcuts: {
                win_open: 'Ctrl+Shift+Alt+P',
                mac_open: 'Option+Shift+P',
            }
        }));
    }

  try {
    const data = fs.readFileSync(configPath);
    return JSON.parse(data);
  } catch (e) {
    
    console.log("Failed to load config:", e);
    throw e;

  }
}

data = loadConfig();
module.exports = { data };
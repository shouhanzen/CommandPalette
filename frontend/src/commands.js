const path = require('path');
const log = require('electron-log');


const cmdMRU = require("./cmd_mru.js");

function clear_cmd_MRU(win, app) {
    cmdMRU.clear_cmd_MRU();
    win.webContents.send('mru-change', cmdMRU.mru);
}

function quit_prog(win, app) {
    app.quit();
}

const commands_data = [
    { 
      title: "Clear Command History", 
      description: "Clears CMD MRU", 
      command: clear_cmd_MRU, 
      issuer: "electron", 
      closes_palette: false, 
      tags: ["MRU"],
      icon: "palette.svg",
      disabled: false,
    },
    { 
      title: "Quit", 
      description: "Quits the program", 
      command: quit_prog, 
      issuer: "electron", 
      closes_palette: false, 
      tags: ["Exit", "Leave"],
      icon: "palette.svg",
      disabled: false,
    },
];

const command_issuers = [
  // {
  //   name: "uvicorn",
  //   url: "http://127.0.0.1:8000",
  // },
]

function get_issuers() {
  return command_issuers;
}

async function get_commands() {
    // Strip out the commands from the commands data
    let commands_temp = [];

    for (command in commands_data) {
        let cmd = {... commands_data[command]};
        delete cmd['command'];
        commands_temp.push(cmd);
    }

    // Assert that issuers are unique
    let issuers = new Set();
    for (issuer in command_issuers) {
        let name = command_issuers[issuer].name;
        if (issuers.has(name)) {
        console.error(`Duplicate issuer name: ${name}`);
        }
        issuers.add(name);
    }

    // Retrieve commands from each issuer
    for (issuer in command_issuers) {
      const issuer_data = command_issuers[issuer];
      await commandsFromIssuer(issuer_data, commands_temp);
    }

    // Check that commands all have unique titles
    let titles = new Set();
    for (command in commands_temp) {
        let title = commands_temp[command].title;
        if (titles.has(title)) {
        console.error(`Duplicate command title: ${title}`);
        }
        titles.add(title);
    }

    return commands_temp;
}

async function commandsFromIssuer(issuer_data, commands_temp) {
  try {
    const response = await fetch(issuer_data.url + "/commands");
    // Check if the response is valid
    if (!response.ok) {
      throw `Error retrieving commands from ${issuer_data.name}: ${response.status} ${response.statusText}`;
    }

    const commands = await response.json();

    for (c_ind in commands) {
      command = commands[c_ind];
      command.issuer = issuer_data.name;

      if (!("icon" in command)) {
      }
      else if (command.icon === "")
        delete command.icon;
      else {
        command.icon = issuer_data.url + command.icon;
      }
    }

    commands_temp.push(...commands);
  } catch (err) {
    console.error(err);
  }
}

async function runCommand(command, win, app) {
  // Check the issuer of the command
  for (issuer in command_issuers) {
    if (command.issuer === command_issuers[issuer].name) {
      // If the issuer is known, run the command
      try {
        const response = await fetch(command_issuers[issuer].url + "/run-command", {
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
      return;
    }
  }

  if (command.issuer === 'electron') {
    // If the issuer is not uvicorn, run the command here
    console.log('Running command:', command);

    // Run the command
    // First, match the original command
    original_cmd = commands_data.find((cmd) => cmd.title === command.title);
    console.log('Original command:', original_cmd);

    if (original_cmd) {
      // If the original command is found, run it
      original_cmd.command(win, app);
    } else {
      // Raise exception
      throw `Command not found: ${command.title}`;
    }
  } else {
    // Raise exception
    throw `Issuer not found: ${command.issuer}`;
  }
}

async function register_issuer(issuer, win) {
  log.info(`Registering issuer ${issuer.name} at url ${issuer.url}`)

  while (true) {
    try {
      let health_path = issuer.url + "/health";

      log.info(`Waiting for backend to start at url ${health_path}`);

      AbortSignal.timeout ??= function timeout(ms) {
        const ctrl = new AbortController()
        setTimeout(() => {
          log.info(`Timeout after ${ms}ms`);
          ctrl.abort()
        }, ms)
        return ctrl.signal
      }
      
      const response = await fetch(health_path, { signal: AbortSignal.timeout(5000) });
      log.info(`Backend response: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        log.info("Backend started/detected successfully");
        break; // Exit the loop if the server is up
      } else {
        log.error("Backend failed to start");
      }
    } catch (error) {
      log.info(`Waiting for backend to start at url ${issuer.url}: ` + error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
  }
  log.info(`Backend started/detected on url ${issuer.url}`);

  // Add the issuer to the list of issuers
  command_issuers.push(issuer);
  
  // Get new commands and upsert
  new_commands = await get_commands();
  log.debug("New commands: " + new_commands);
  win.webContents.send('new-commands', new_commands);
}

// export default commands_data;
module.exports.commands_data = commands_data;
module.exports.get_commands = get_commands;
module.exports.runCommand = runCommand;
module.exports.command_issuers = command_issuers;
module.exports.register_issuer = register_issuer;
module.exports.get_issuers = get_issuers;
const cmdMRU = require("./cmd_mru.js");

function clear_cmd_MRU(win, app) {
    cmdMRU.clear_cmd_MRU();
    win.webContents.send('mru-change', cmdMRU.mru);
}

function quit_prog(win, app) {
    app.quit();
}

const commands_data = [
    { title: "Clear Command History", description: "Clears CMD MRU", command: clear_cmd_MRU, issuer: "electron", closes_palette: false },
    { title: "Quit", description: "Quits the program", command: quit_prog, issuer: "electron", closes_palette: false },
];

async function get_commands() {
    // Strip out the commands from the commands data
    let commands_temp = [];

    for (command in commands_data) {
        let cmd = {... commands_data[command]};
        delete cmd['command'];
        commands_temp.push(cmd);
    }

    try {
        // Also get commands from uvicorn server
        const response = await fetch('http://127.0.0.1:8000/commands');
        const python_commands = await response.json();
        commands_temp.push(...python_commands);
    } catch (err) {
        console.error(err);
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

async function runCommand(command, win, app) {
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
    original_cmd = commands_data.find((cmd) => cmd.title === command.title);
    console.log('Original command:', original_cmd);

    if (original_cmd) {
      // If the original command is found, run it
      original_cmd.command(win, app);
    } else {
      // Raise exception
      throw `Command not found: ${command.title}`;
    }
  }
}

// export default commands_data;
module.exports.commands_data = commands_data;
module.exports.get_commands = get_commands;
module.exports.runCommand = runCommand;
const cmdMRU = require("./cmd_mru.js");

function clear_cmd_MRU(win) {
    cmdMRU.clear_cmd_MRU();
    win.webContents.send('mru-change', cmdMRU.mru);
}

const commands_data = [
    { title: "Clear Command History", description: "Clears CMD MRU", command: clear_cmd_MRU, issuer: "electron" },
];

// export default commands_data;
module.exports.commands_data = commands_data;
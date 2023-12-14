let mru = []; // Most recently used commands, stores their titles
const MRU_SIZE = 10;

function clear_cmd_MRU() {
    console.log('Clearing command MRU');

    mru = [];
}

function update_cmd_MRU(command) {
    // Update the MRU list
    mru = mru.filter((cmd_title) => cmd_title !== command.title);
    mru.unshift(command.title);
    if (mru.length > MRU_SIZE) { // Limit to 10 entries
        mru.pop();
    }

    return mru;
}

module.exports.mru = mru;
module.exports.MRU_SIZE = MRU_SIZE;
module.exports.clear_cmd_MRU = clear_cmd_MRU;
module.exports.update_cmd_MRU = update_cmd_MRU;
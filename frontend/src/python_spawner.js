const { spawn } = require('child_process');
const path = require('path');

const { fileURLToPath } = require('url');

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

function spawnBackend() {
    const pythonScriptPath = path.join(__dirname, '../../backend/src/main.py');

    const pythonProcess = spawn('python', [pythonScriptPath]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    return pythonProcess;
}

module.exports = { spawnBackend };
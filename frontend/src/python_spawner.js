import { spawn } from 'child_process';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function spawnBackend() {
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
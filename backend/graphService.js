const { spawn } = require('child_process');
const path = require('path');

function analyzeGraph(transactions) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [path.join(__dirname, 'analyze.py')]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}: ${errorString}`));
      }
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${err.message}\nOutput: ${dataString}`));
      }
    });

    
    pythonProcess.stdin.write(JSON.stringify(transactions));
    pythonProcess.stdin.end();
  });
}

module.exports = { analyzeGraph };

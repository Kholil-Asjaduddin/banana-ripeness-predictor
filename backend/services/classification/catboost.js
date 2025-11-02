const { spawn } = require('child_process');
const path = require('path');

function predictKategori(r, g, b) {
  
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'predict.py');
    
    const pyProcess = spawn('python', [
      scriptPath,
      r,
      g,
      b
    ]);

    let result = '';
    let error = '';

    // Tangkap apa yang di print oleh Python
    pyProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    pyProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0 || error) {
        reject(new Error(`Python script error: ${error}`));
      } else {
        resolve(result.trim());
      }
    });

    pyProcess.on('error', (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

module.exports = { predictKategori }; 
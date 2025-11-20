const fs = require('fs');
const path = require('path');

// Euclidean distance (konversi boolean → angka 0/1 agar aman)
const distance = (a, b) => {
  return Math.sqrt(a.reduce((sum, val, i) => {
    const va = (typeof val === 'boolean') ? (val ? 1 : 0) : val;
    const vb = (typeof b[i] === 'boolean') ? (b[i] ? 1 : 0) : b[i];
    return sum + Math.pow(va - vb, 2);
  }, 0));
};

// Load model configuration
const configPath = path.join(__dirname, 'knn_model_config.json');
const model = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { k, X_train, y_train } = model;

/**
 * Predict nextPhase (in days) using KNN regression
 * @param {number} tvoc - normalized tvoc value (0 to 1)
 * @param {number} co2 - normalized co2 value (0 to 1)
 * @param {number} r - normalized red channel
 * @param {number} g - normalized green channel
 * @param {number} b - normalized blue channel
 * @param {string} ripeness - one of 'raw', 'ripe', 'spoiled'
 * @returns {number} predicted nextPhase
 */
function predictNextPhase(tvoc, co2, r, g, b, ripeness) {
  const ripenessMap = {
    raw: [1, 0, 0],
    ripe: [0, 1, 0],
    spoiled: [0, 0, 1]
  };

  if (!ripenessMap[ripeness]) {
    throw new Error(`Invalid ripeness value: ${ripeness}`);
  }

  const x_input = [tvoc, co2, r, g, b, ...ripenessMap[ripeness]];

  // Hitung jarak ke semua data training
  const distances = X_train.map((x, i) => ({
    index: i,
    dist: distance(x, x_input)
  }));

  // Ambil k tetangga terdekat
  const nearest = distances.sort((a, b) => a.dist - b.dist).slice(0, k);

  // Prediksi = rata-rata y_train dari tetangga terdekat
  const prediction = nearest.reduce((sum, { index }) => sum + y_train[index], 0) / k;

  return prediction;
}

module.exports = { predictNextPhase };
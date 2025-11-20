const fs = require('fs');
const path = require('path');

// Euclidean distance
const distance = (a, b) => {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
};

// Load model configuration
const configPath = path.join(__dirname, 'knn_model_config.json');
const model = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { k, X_train, y_train } = model;

/**
 * Predict nextPhase (in days) using KNN regression
 * @param {number} tvoc - normalized tvoc value (0 to 1)
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

  const distances = X_train.map((x, i) => ({
    index: i,
    dist: distance(x, x_input)
  }));

  const nearest = distances.sort((a, b) => a.dist - b.dist).slice(0, k);
  const prediction = nearest.reduce((sum, { index }) => sum + y_train[index], 0) / k;

  return prediction;
}

module.exports = { predictNextPhase };
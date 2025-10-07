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
function predictNextPhase(tvoc, ripeness) {
  // Early exit: no prediction needed for spoiled fruit
  if (ripeness === 'spoiled') {
    return null; // or you can return 0, or throw an error, depending on your needs
  }

  // One-hot encode ripeness
  const ripenessMap = {
    raw: [true, false, false],
    ripe: [false, true, false],
    spoiled: [false, false, true]
  };

  if (!ripenessMap[ripeness]) {
    throw new Error(`Invalid ripeness value: ${ripeness}`);
  }

  const x_input = [tvoc, ...ripenessMap[ripeness].map(v => v ? 1 : 0)];

  // Calculate the distance to all X_train
  const distances = X_train.map((x, i) => ({
    index: i,
    dist: distance(x, x_input)
  }));

  // Take k nearest neighbors
  const nearest = distances.sort((a, b) => a.dist - b.dist).slice(0, k);

  // Calculate the average y of the neighbors
  const prediction = nearest.reduce((sum, { index }) => sum + y_train[index], 0) / k;

  return prediction;
}

module.exports = { predictNextPhase };
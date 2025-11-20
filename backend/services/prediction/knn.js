const fs = require('fs');
const path = require('path');

// Euclidean distance
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

const { k, X_train, y_train, normalization } = model;

// Validasi: pastikan parameter normalisasi ada
if (!normalization) {
  console.error('WARNING: Normalization parameters not found in model config!');
  console.error('Please regenerate the model with normalization parameters.');
}

/**
 * Normalize a value using min-max normalization
 * @param {number} value - raw value
 * @param {number} min - minimum value from training
 * @param {number} max - maximum value from training
 * @returns {number} normalized value (0 to 1)
 */
function normalize(value, min, max) {
  if (max === min) return 0; // Hindari division by zero
  return (value - min) / (max - min);
}

/**
 * Predict nextPhase (in days) using KNN regression
 * @param {number} tvoc - RAW tvoc value (akan dinormalisasi otomatis)
 * @param {number} co2 - RAW co2 value (akan dinormalisasi otomatis)
 * @param {number} r - RAW red channel (akan dinormalisasi otomatis)
 * @param {number} g - RAW green channel (akan dinormalisasi otomatis)
 * @param {number} b - RAW blue channel (akan dinormalisasi otomatis)
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

  // PENTING: Normalisasi input menggunakan min/max dari training
  let tvoc_norm = tvoc;
  let co2_norm = co2;
  let r_norm = r;
  let g_norm = g;
  let b_norm = b;

  if (normalization) {
    tvoc_norm = normalize(tvoc, normalization.tvoc.min, normalization.tvoc.max);
    co2_norm = normalize(co2, normalization.co2.min, normalization.co2.max);
    r_norm = normalize(r, normalization.r.min, normalization.r.max);
    g_norm = normalize(g, normalization.g.min, normalization.g.max);
    b_norm = normalize(b, normalization.b.min, normalization.b.max);

    // Debug log (bisa dihapus di production)
    console.log('Input normalization:', {
      tvoc: `${tvoc} → ${tvoc_norm.toFixed(4)}`,
      co2: `${co2} → ${co2_norm.toFixed(4)}`,
      r: `${r} → ${r_norm.toFixed(4)}`,
      g: `${g} → ${g_norm.toFixed(4)}`,
      b: `${b} → ${b_norm.toFixed(4)}`
    });
  } else {
    console.warn('Using input values as-is (no normalization parameters available)');
  }

  const x_input = [tvoc_norm, co2_norm, r_norm, g_norm, b_norm, ...ripenessMap[ripeness]];

  // Hitung jarak ke semua data training
  const distances = X_train.map((x, i) => ({
    index: i,
    dist: distance(x, x_input)
  }));

  // Ambil k tetangga terdekat
  const nearest = distances.sort((a, b) => a.dist - b.dist).slice(0, k);

  // Debug: tampilkan tetangga terdekat
  console.log(`Nearest ${k} neighbors:`, nearest.slice(0, 3).map(n => 
    `[idx=${n.index}, dist=${n.dist.toFixed(4)}, y=${y_train[n.index]}]`
  ));

  // Prediksi = rata-rata y_train dari tetangga terdekat
  const prediction = nearest.reduce((sum, { index }) => sum + y_train[index], 0) / k;

  console.log(`Prediction: ${prediction} days`);
  
  return prediction;
}

module.exports = { predictNextPhase };
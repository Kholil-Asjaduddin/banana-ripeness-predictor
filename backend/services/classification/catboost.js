const { InferenceSession, Tensor } = require('onnxruntime-node');
const path = require('path');

// --- 1. Konversi Logika 'add_features' dari Python ke JS ---
// (Termasuk helper untuk colorsys.rgb_to_hsv)

/**
 * Mengkonversi RGB ke HSV.
 * (Pengganti colorsys.rgb_to_hsv dari Python)
 */
function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  let diff = max - min;
  s = max === 0 ? 0 : diff / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
      case g: h = (b - r) / diff + 2; break;
      case b: h = (r - g) / diff + 4; break;
    }
    h /= 6;
  }
  return [h, s, v];
}

/**
 * Membuat 13 fitur input untuk model,
 * persis seperti di skrip Python.
 */
function createFeatures(r, g, b) {
  const EPS = 1e-6;

  // Ubah jadi angka
  r = parseFloat(r);
  g = parseFloat(g);
  b = parseFloat(b);

  const s = r + g + b + EPS;
  const brightness = s / 3.0;
  const r_chroma = r / s;
  const g_chroma = g / s;
  const b_chroma = b / s;
  const rg_ratio = r / (g + EPS);
  const gb_ratio = g / (b + EPS);
  const br_ratio = b / (r + EPS);

  const [hue, saturation, value] = rgbToHsv(r, g, b);

  // Urutan HARUS sama persis dengan saat training
  const featureArray = [
    r, g, b, 
    brightness, 
    r_chroma, g_chroma, b_chroma,
    rg_ratio, gb_ratio, br_ratio,
    hue, saturation, value
  ];

  // Ubah jadi Float32Array untuk ONNX
  return new Float32Array(featureArray);
}

// --- 2. Fungsi Prediksi Utama (Async) ---

// Kita buat session modelnya di luar agar bisa di-reuse
// (Ini mempercepat prediksi setelah panggilan pertama)
let session;
const modelPath = path.join(__dirname, 'catboost_model.onnx');

// Fungsi inisialisasi session
async function getSession() {
  if (!session) {
    try {
      // Buat session ONNX dan muat modelnya
      session = await InferenceSession.create(modelPath);
      console.log("Model ONNX (CatBoost) berhasil dimuat.");
    } catch (e) {
      console.error("Gagal memuat model ONNX:", e);
      throw new Error("Model_Load_Failed");
    }
  }
  return session;
}

/**
 * Fungsi utama yang akan dipanggil oleh controller.
 * Tidak ada lagi spawn, tidak ada lagi Promise manual.
 */
async function predictKategori(r, g, b) {
  try {
    const activeSession = await getSession();
    console.log("Input names:", activeSession.inputNames);
console.log("Output names:", activeSession.outputNames);
console.log("Metadata:", activeSession.inputMetadata);

    // Buat fitur
    const features = createFeatures(r, g, b);

    // Tensor input
    const inputTensor = new Tensor('float32', features, [1, 13]);

    // Pastikan nama input sesuai
    const inputName = activeSession.inputNames[0]; 
    const feeds = { [inputName]: inputTensor };

    // Jalankan prediksi
    const results = await activeSession.run(feeds);

    for (const name of activeSession.outputNames) {
  console.log(name, results[name]);
}

    // Ambil output pertama
    let labelIndex;
    if (results.class) {
      labelIndex = results.class.data[0];
    } else if (results.probabilities) {
      const probs = results.probabilities.data;
      labelIndex = probs.indexOf(Math.max(...probs));
    } else {
      throw new Error("Tidak ada output tensor yang valid");
    }

    const labels = ["mentah", "matang", "busuk"];
    return labels[labelIndex] || labelIndex;
  } catch (e) {
    console.error("ONNX prediction error:", e);
    throw new Error(`Prediction_Failed: ${e.message}`);
  }
}

module.exports = { predictKategori };
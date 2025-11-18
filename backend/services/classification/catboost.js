const fetch = require('node-fetch');

const ML_API_URL = process.env.ML_API_URL;

async function predictKategori(r, g, b) {

  if (!ML_API_URL) {
    console.error('Error: ML_API_URL environment variable is not set.');
    throw new Error('ML API URL not configured');
  }

  try {
    // Panggil API FastAPI
    const response = await fetch(ML_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        r: parseFloat(r), // Pastikan datanya angka
        g: parseFloat(g),
        b: parseFloat(b),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('ML API returned an error:', response.status, errorBody);
      throw new Error(`ML API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.prediction; 

  } catch (err) {
    console.error('Failed to call ML API:', err);
    throw new Error(`Python API call failed: ${err.message}`);
  }
}

module.exports = { predictKategori };
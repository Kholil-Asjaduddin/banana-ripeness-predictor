const mqtt = require('mqtt');
const { predictNextPhase } = require('../services/prediction/knn');
const { predictKategori } = require('../services/classification/catboost');

const client = mqtt.connect(process.env.MQTT_BROKER_URL);

// Simpan handler per device agar bisa dilepas saat stop
const handlers = {};

module.exports = () => {
  // Mulai prediksi: subscribe ke dataTopic, pasang handler
  const startPredict = async (req, res) => {
    const { idDevice } = req.body;
    if (!idDevice) return res.status(400).json({ error: 'Missing device ID' });

    const dataTopic = `device-${idDevice}/data`;
    const predictionTopic = `device-${idDevice}/prediction`;

    // Subscribe ke topik data sensor
    client.subscribe(dataTopic, { qos: 1 }, (err) => {
      if (err) {
        console.error('Subscribe error:', err);
        return res.status(500).json({ error: 'Failed to subscribe' });
      }
      console.log(`Subscribed to ${dataTopic}`);
    });

    // Handler untuk data sensor
    const handler = async (topic, message) => {
      if (topic !== dataTopic) return;

      let sensorData;
      try {
        sensorData = JSON.parse(message.toString());
        console.log('Sensor data received:', sensorData);
      } catch (e) {
        console.error('Invalid JSON from device:', e);
        return;
      }

      const { r, g, b, tvoc } = sensorData;
      if (r == null || g == null || b == null || tvoc == null) {
        console.error('Sensor data missing r, g, b, or tvoc fields.');
        return;
      }

      try {
        // Panggil Catboost
        const ripenessIND = await predictKategori(r, g, b);
        const mapping = {
          'mentah': 'raw',
          'matang': 'ripe',
          'busuk': 'spoiled'
        };
        const ripeness = mapping[ripenessIND];
        
        if (!ripeness) {
          console.error(`Kategori tidak dikenal dari CatBoost: ${ripenessIND}`);
          return; 
        }

        // Panggil KNN
        const nextPhase = predictNextPhase(tvoc, ripeness);

        const predictionResult = {
          idDevice,
          sensor: sensorData,
          ripeness,
          nextPhase,
          timestamp: new Date().toISOString()
        };

        // Publish hasil prediksi
        client.publish(predictionTopic, JSON.stringify(predictionResult), { qos: 1 });
        console.log(`Published prediction to ${predictionTopic}:`, predictionResult);

      } catch (err) {
        console.error('Prediction error:', err);
      }
    };

    // Simpan handler agar bisa dilepas saat stop
    if (!handlers[idDevice]) {
      client.on('message', handler);
      handlers[idDevice] = { handler, dataTopic };
    }

    res.json({
      message: `Subscribed to ${dataTopic}, prediction will be published to ${predictionTopic}`,
      idDevice,
      predictionTopic
    });
  };

  // Hentikan prediksi: unsubscribe dan remove listener
  const stopPredict = async (req, res) => {
    const { idDevice } = req.body;
    if (!idDevice) return res.status(400).json({ error: 'Missing device ID' });

    const record = handlers[idDevice];
    if (record) {
      client.removeListener('message', record.handler);
      client.unsubscribe(record.dataTopic);
      delete handlers[idDevice];
      console.log(`Stopped prediction for device ${idDevice}`);
      return res.json({ message: `Stopped prediction for ${idDevice}` });
    } else {
      return res.status(400).json({ error: `No active prediction for ${idDevice}` });
    }
  };

  return { startPredict, stopPredict };
};
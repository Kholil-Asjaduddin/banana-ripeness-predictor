const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');
const { predictNextPhase } = require('../services/prediction/knn');

module.exports = () => {
  const startPrediction = async (req, res) => {
    const { idDevice } = req.body;
    if (!idDevice) return res.status(400).json({ error: 'Missing device ID' });

    const controlTopic = `device-${idDevice}/control/start`;
    const dataTopic = `device-${idDevice}/data`;
    const payload = JSON.stringify({ start: true });

    client.publish(controlTopic, payload, { qos: 1 }, (err) => {
      if (err) return res.status(500).json({ error: 'Failed to publish' });

      client.subscribe(dataTopic, { qos: 1 }, (err) => {
        if (err) {
          console.error('Subscribe error:', err);
          return res.status(500).json({ error: 'Failed to subscribe to device data' });
        }
        console.log(`Subscribed to ${dataTopic}`);
      });

      const handler = (topicName, message) => {
        if (topicName === dataTopic) {
          clearTimeout(timeout);

          let sensorData;
          try {
            sensorData = JSON.parse(message.toString());
          } catch (e) {
            console.error('Invalid JSON from device:', e);
            res.status(400).json({ error: 'Invalid sensor data format' });
            return;
          }

          const ripeness = "raw"; // TODO: ganti dengan klasifikasi nyata
          const nextPhase = predictNextPhase(sensorData.tvoc, ripeness);

          res.json({ ripeness, nextPhase });

          // Cleanup
          client.removeListener('message', handler);
          client.unsubscribe(dataTopic);
        }
      };

      client.on('message', handler);

      // Timeout if device does not respond
      const timeout = setTimeout(() => {
        client.removeListener('message', handler);
        client.unsubscribe(dataTopic);
        if (!res.headersSent) {
          res.status(504).json({ error: 'Device did not respond in time' });
        }
      }, 10000);
    });
  };

  return { startPrediction };
};
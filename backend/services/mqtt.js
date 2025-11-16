const mqtt = require('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org:1883';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log(`[MQTT Service] Connected to ${brokerUrl}`);
});

client.on('error', (err) => {
  console.error('[MQTT Service] Connection error:', err);
});

module.exports = client;
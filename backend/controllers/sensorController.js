const { DateTime } = require('luxon');

module.exports = (db) => {
  const saveSensorData = async (req, res) => {
    try {
      const { r, g, b, tvoc, co2, timestamp } = req.body;

      if ([r, g, b, tvoc, co2].some(val => val === undefined)) {
        return res.status(400).json({ error: 'Missing required sensor fields' });
      }

      const jakartaTime = timestamp || DateTime.now().setZone('Asia/Jakarta').toISO();

      await db.collection('sensor_readings').add({
        r: Number(r),
        g: Number(g),
        b: Number(b),
        tvoc: Number(tvoc),
        co2: Number(co2),
        timestamp: jakartaTime,
        ripeness: "unlabeled",
        nextPhase: -1
      });

      res.status(201).json({ message: 'Sensor data saved successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  return { saveSensorData };
};
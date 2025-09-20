module.exports = (db) => {
  const saveSensorData = async (req, res) => {
    try {
      const { r, g, b, tvoc, timestamp } = req.body;

      if ([r, g, b, tvoc].some(val => val === undefined)) {
        return res.status(400).json({ error: 'Missing required sensor fields' });
      }

      await db.collection('sensor_readings').add({
        r: Number(r),
        g: Number(g),
        b: Number(b),
        tvoc: Number(tvoc),
        timestamp: timestamp || new Date().toISOString(),
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
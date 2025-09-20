module.exports = (db) => {
  const getTrainingData = async (req, res) => {
    try {
      const snapshot = await db.collection('sensor_readings').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  return { getTrainingData };
};
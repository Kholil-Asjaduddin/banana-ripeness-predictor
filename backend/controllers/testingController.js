const client = require('../services/mqtt'); 

module.exports = () => {

  const sendDummyData = async (req, res) => {
    const { idDevice, kata } = req.body; 

    if (!idDevice || !kata) {
      return res.status(400).json({ error: 'Missing device ID or kata' });
    }

    const dataTopic = `device-${idDevice}/data`; 

    client.publish(dataTopic, kata, { qos: 1 }, (err) => {
      if (err) {
        console.error('Failed to publish dummy data:', err);
        return res.status(500).json({ error: 'Failed to publish' });
      }
      
      console.log(`Published dummy string to ${dataTopic}: "${kata}"`);
      res.json({ 
        message: 'Dummy string sent successfully', 
        topic: dataTopic, 
        data: kata 
      });
    });
  };

  return { sendDummyData };
};
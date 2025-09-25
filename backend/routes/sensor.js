const express = require('express');

module.exports = (db) => {
  const router = express.Router();
  const { saveSensorData } = require('../controllers/sensorController')(db);

  router.post('/', saveSensorData);

  return router;
};
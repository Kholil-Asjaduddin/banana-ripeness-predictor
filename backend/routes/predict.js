const express = require('express');

module.exports = () => {
  const router = express.Router();
  const { startPrediction } = require('../controllers/predictController')();

  router.post('/start', startPrediction);

  return router;
};
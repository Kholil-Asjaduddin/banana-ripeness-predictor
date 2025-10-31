const express = require('express');

module.exports = () => {
  const router = express.Router();
  const { startPredict, stopPredict } = require('../controllers/predictController')();

  router.post('/start', startPredict);
  router.post('/stop', stopPredict);

  return router;
};
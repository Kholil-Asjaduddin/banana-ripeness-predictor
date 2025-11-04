const express = require('express');

module.exports = () => {
  const router = express.Router();
  const { sendDummyData } = require('../controllers/testingController')();

  router.post('/dummy', sendDummyData);

  return router;
};
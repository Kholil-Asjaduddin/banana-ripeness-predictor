const express = require('express');

module.exports = (db) => {
  const router = express.Router();
  const { getTrainingData } = require('../controllers/trainingController')(db);

  router.get('/', getTrainingData);

  return router;
};
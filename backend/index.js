const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');

const { db } = require('./middleware/firebase');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const sensorRoutes = require('./routes/sensor')(db);
const trainingRoutes = require('./routes/training')(db);
const predictRoutes = require('./routes/predict')();

app.use('/api/sensor', sensorRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/predict', predictRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
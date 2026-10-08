require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { success, error } = require('./utils/envelope');
const stationRoutes = require('./routes/stationRoutes');
const internalRoutes = require('./routes/internalRoutes');
const { seedStationsIfNeeded } = require('./utils/seedStations');

const app = express();
const PORT = process.env.PORT || 5003;
const SERVICE_NAME = process.env.SERVICE_NAME || 'station-service';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});

app.get('/health', (req, res) => success(res, { service: SERVICE_NAME, status: 'UP' }, 'ok'));
app.use('/api/stations', stationRoutes);
app.use('/internal/stations', internalRoutes);

app.use((req, res) => error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404));

app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  return error(res, err.message || 'Internal Server Error', err.status || 500);
});

async function startServer() {
  await connectDB();
  await seedStationsIfNeeded();
  const server = app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
  });
  return { app, server };
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

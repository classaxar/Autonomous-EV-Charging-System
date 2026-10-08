require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { success, error } = require('./utils/envelope');

const app = express();
const PORT = process.env.PORT || 5005;
const SERVICE_NAME = process.env.SERVICE_NAME || 'decision-service';

// Middleware
app.use(cors());
app.use(express.json());

// Compact request logger (method path status)
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});

// Mandatory Health check (no auth required)
app.get('/health', (req, res) => {
  return success(res, { service: SERVICE_NAME, status: 'UP' }, 'ok');
});

// Placeholder for service-specific routes
// app.use('/api/...', routes);

// 404 handler
app.use((req, res) => {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  return error(res, err.message || 'Internal Server Error', err.status || 500);
});

async function startServer() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
  });
  return { app, server };
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

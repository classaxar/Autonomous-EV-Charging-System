require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { success, error } = require('./utils/envelope');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';

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

// Auth Routes per RULEBOOK Section 6
app.use('/api/auth', authRoutes);

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
  try {
    const { seedUsers } = require('./scripts/seed');
    await seedUsers();
  } catch (err) {
    console.warn(`[Seed] Auto-seed skipped: ${err.message}`);
  }

  const server = app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
  });
  return { app, server };
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

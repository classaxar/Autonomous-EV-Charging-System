require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const { getProxyRoutes } = require('./config/proxy');
const { success, error } = require('./utils/envelope');

const app = express();
const PORT = process.env.PORT || 5000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'api-gateway';

// CORS Configuration per RULEBOOK Section 6
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

// Rate limiter per TASKBOOK A-11 (100 req/min/IP)
const { defaultRateLimiter } = require('./middleware/rateLimiter');
app.use(defaultRateLimiter);

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

// Strictly block all /internal routes per RULEBOOK Section 5 and TASKBOOK A-04
app.all('/internal*', (req, res) => {
  return error(res, 'Route not found: internal routes cannot be accessed via API Gateway', 404);
});

// Proxy routes per RULEBOOK Section 6
const routes = getProxyRoutes();
for (const route of routes) {
  app.use(
    route.path,
    createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      on: {
        proxyReq: fixRequestBody,
        error: (err, req, res) => {
          console.error(`[Gateway Proxy Error] ${req.method} ${req.originalUrl} -> ${route.target}: ${err.message}`);
          if (!res.headersSent) {
            return error(res, `Service unavailable: ${route.service} is not responding`, 503);
          }
        }
      }
    })
  );
}

// Body parser for any local fallback routes
app.use(express.json());

// 404 handler for unknown routes
app.use((req, res) => {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  return error(res, err.message || 'Internal Server Error', err.status || 500);
});

async function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
  });
  return { app, server };
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

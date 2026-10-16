const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;

// Upstream API Gateway
const GATEWAY_HOST = process.env.API_GATEWAY_HOST || 'api-gateway';
const GATEWAY_PORT = process.env.API_GATEWAY_PORT || 5000;

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: { service: 'frontend', status: 'UP' },
    message: 'ok'
  });
});

// Proxy all /api requests to API Gateway
app.use('/api', (clientReq, clientRes) => {
  const options = {
    hostname: GATEWAY_HOST,
    port: GATEWAY_PORT,
    path: '/api' + clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: `${GATEWAY_HOST}:${GATEWAY_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('[Frontend API Proxy Error]', err.message);
    if (!clientRes.headersSent) {
      clientRes.status(502).json({
        success: false,
        message: 'Unable to reach API Gateway. Please ensure backend services are running.'
      });
    }
  });

  clientReq.pipe(proxyReq, { end: true });
});

// Serve frontend static assets
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Autonomous EV Charging System</title>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2rem; border-radius: 0.75rem; border: 1px solid #334155; text-align: center; }
    h1 { color: #38bdf8; margin-bottom: 0.5rem; }
    p { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚡ Autonomous EV Charging System</h1>
    <p>Frontend SPA container running on port ${PORT}.</p>
  </div>
</body>
</html>`);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[frontend] Listening on port ${PORT} (0.0.0.0)`);
});

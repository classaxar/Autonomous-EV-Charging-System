const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: { service: 'frontend', status: 'UP' },
    message: 'ok'
  });
});

app.use(express.static(path.join(__dirname, 'dist')));

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

app.listen(PORT, () => {
  console.log(`[frontend] Listening on port ${PORT}`);
});

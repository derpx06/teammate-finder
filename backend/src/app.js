const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const passport = require('./config/passportConfig');
app.use(passport.initialize());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, _req, res, _next) => {
  res.status(500).json({
    error: err?.message || 'Internal Server Error',
  });
});

module.exports = app;

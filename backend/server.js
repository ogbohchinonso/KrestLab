require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');

// Routes
const authRoutes     = require('./routes/auth');
const snippetRoutes  = require('./routes/snippets');
const executeRoutes  = require('./routes/execute');
const tutorRoutes    = require('./routes/tutor');
const userRoutes     = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  message:  { error: 'Too many requests, please slow down.' },
});

const executeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max:      20,
  message:  { error: 'Execution rate limit reached. Wait a moment.' },
});

const tutorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message:  { error: 'AI tutor rate limit reached. Wait a moment.' },
});

app.use('/api/', apiLimiter);
app.use('/api/execute', executeLimiter);
app.use('/api/tutor',   tutorLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/execute',  executeRoutes);
app.use('/api/tutor',    tutorRoutes);
app.use('/api/users',    userRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`KrestLab API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

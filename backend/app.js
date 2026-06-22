import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import programRoutes from './routes/programRoutes.js';
import regulationRoutes from './routes/regulationRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import userRoutes from './routes/userRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import peoPsoRoutes from './routes/peoPsoRoutes.js';
import peoRoutes from './routes/peoRoutes.js';
import psoRoutes from './routes/psoRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import curriculumBookRoutes from './routes/curriculumBookRoutes.js';
import minorStreamRoutes from './routes/minorStreamRoutes.js';
import prerequisiteRoutes from './routes/prerequisiteRoutes.js';
import courseCategoryRoutes from './routes/courseCategoryRoutes.js';
import courseAssignmentRoutes from './routes/courseAssignmentRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = process.env.HOST || '127.0.0.1';
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// ─────────────────────────────────────────────
// Security Middlewares
// ─────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS — environment-aware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: isProd ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(mongoSanitize());

// ─────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 500 : 100000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use('/api', apiLimiter);

// ─────────────────────────────────────────────
// Body Parsing
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle invalid JSON payloads before route handlers
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    console.error('[JSON Parse Error]', err.message);
    return res.status(400).json({ message: 'Malformed JSON request body. Please check your input and try again.' });
  }
  next(err);
});

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    env: NODE_ENV,
    app: 'Aditya University OBCPM API v1.0'
  });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/regulations', regulationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/peo-pso', peoPsoRoutes);
app.use('/api/peos', peoRoutes);
app.use('/api/psos', psoRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/curriculum-books', curriculumBookRoutes);
app.use('/api/minor-streams', minorStreamRoutes);
app.use('/api/prerequisites', prerequisiteRoutes);
app.use('/api/course-categories', courseCategoryRoutes);
app.use('/api/course-assignments', courseAssignmentRoutes);

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// In production: serve the built frontend SPA
if (isProd) {
  const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendBuild));
  // Catch-all — send SPA index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// ─────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `API Endpoint [${req.method}] ${req.originalUrl} not found.` });
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[System Error Handler]', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Database validation failed.',
      errors: Object.values(err.errors || {}).map(val => ({ field: val.path, message: val.message }))
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid format for field ${err.path}: "${err.value}". Expected a valid identifier.`
    });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(409).json({
      message: `Duplicate value error: A record with ${field} "${value}" already exists.`
    });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid authorization token. Access denied.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Authorization token expired. Please refresh your session.' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error. Please contact support.',
    error: !isProd ? err.stack : undefined
  });
});

// ─────────────────────────────────────────────
// Global Process Error Handlers
// ─────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
  process.exit(1);
});

// ─────────────────────────────────────────────
// Start Server — with proper error handling
// ─────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, HOST, () => {
      console.log(`[Server] OBCPM Portal Backend running at http://${HOST}:${PORT} [${NODE_ENV}]`);
    });

    // Handle port-in-use without crashing uncleanly
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Server Error] Port ${PORT} is already in use.`);
        console.error('[Server Error] Kill the existing process and restart:\n  Run: npm run kill-port\n  Or:  npx kill-port ${PORT}\n');
        process.exit(1);
      } else {
        console.error('[Server Error] Unexpected server error:', err.message);
        process.exit(1);
      }
    });

    // Graceful shutdown on SIGTERM (used by Docker/PM2/systemd)
    process.on('SIGTERM', () => {
      console.log('\n[Server] SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => { process.exit(1); }, 10000);
    });

    // Graceful shutdown on Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n[Server] SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => { process.exit(1); }, 5000);
    });

  } catch (error) {
    console.error(`[Server Start Error] ${error.message}`);
    process.exit(1);
  }
};

startServer();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// ── Güvenlik middleware ───────────────────────────
app.use(helmet());

app.use(cors({
  origin: [
    'http://localhost:8081',
    'exp://localhost:8081',
    /^exp:\/\/.*/,
    /^http:\/\/192\.168\..*/,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — 15 dakikada 100 istek
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Çok fazla istek. Lütfen bekle.' },
  validate: { xForwardedForHeader: false }
});
app.use('/api', limiter);

// ── Body parser ───────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ShuttlePay API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API rotaları ──────────────────────────────────
app.use('/api', routes);

// ── 404 & Hata yönetimi ───────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Sunucuyu başlat ───────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║        ShuttlePay API Başladı         ║
║  ─────────────────────────────────    ║
║  Port    : ${PORT}                       ║
║  Ortam   : ${process.env.NODE_ENV || 'development'}              ║
║  Sağlık  : http://localhost:${PORT}/health ║
╚═══════════════════════════════════════╝
  `);
});

export default app;

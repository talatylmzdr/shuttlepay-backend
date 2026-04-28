import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// ── Güvenlik middleware ───────────────────────────
app.use(helmet());

// CORS Ayarları Güncellendi: Railway domaini eklendi
app.use(cors({
  origin: [
    'http://localhost:8081',
    'exp://localhost:8081',
    'https://web-production-202a09.up.railway.app', // Kendi Railway adresin
    /^exp:\/\/.*/,
    /^http:\/\/192\.168\..*/,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — 15 dakikada 100 istek
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  message: { success: false, message: 'Çok fazla istek. Lütfen bekle.' },
  validate: false
});
app.use('/api', limiter);

// ── Body parser ───────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── API rotaları ──────────────────────────────────

// ÖNEMLİ: chatRoutes'u genel 'routes' içine almadıysan burada kalsın
app.use('/api/chat', chatRoutes); 

// Tüm ana API rotaları buradan dağılıyor (/api/auth, /api/payment vb.)
app.use('/api', routes);

// ── Health check ──────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ShuttlePay API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 & Hata yönetimi ───────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Sunucuyu başlat ───────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║         ShuttlePay API Başladı        ║
║  ─────────────────────────────────    ║
║  Port    : ${PORT}                    ║
║  Ortam   : ${process.env.NODE_ENV || 'development'}              ║
║  Sağlık  : http://localhost:${PORT}/health ║
╚═══════════════════════════════════════╝
  `);
});

export default app;
import { Router } from 'express';
import { login, register } from '../controllers/authController';
import {
  getProfile,
  getBalance,
  getTransactions,
} from '../controllers/studentController';
import {
  loadBalance,
  getSavedCards,
  addCard,
  deleteCard,
} from '../controllers/paymentController';
import { chat, getInsights } from '../controllers/aiController';
import { getRoutes } from '../controllers/routesController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ── Auth (giriş gerekmez) ─────────────────────────
router.post('/auth/login', login);
router.post('/auth/register', register);

// ── Öğrenci (giriş gerekir) ──────────────────────
router.get('/student/me', authMiddleware, getProfile);
router.get('/student/balance', authMiddleware, getBalance);
router.get('/student/transactions', authMiddleware, getTransactions);

// ── Ödeme ─────────────────────────────────────────
router.post('/payment/load', authMiddleware, loadBalance);
router.get('/payment/cards', authMiddleware, getSavedCards);
router.post('/payment/cards', authMiddleware, addCard);
router.delete('/payment/cards/:id', authMiddleware, deleteCard);

// ── AI Asistan ────────────────────────────────────
router.post('/ai/chat', authMiddleware, chat);
router.get('/ai/insights', authMiddleware, getInsights);

// ── Servis Hatları (herkese açık) ─────────────────
router.get('/routes', getRoutes);

export default router;

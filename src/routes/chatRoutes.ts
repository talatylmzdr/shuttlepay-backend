import { Router } from 'express';
import { handleChatMessage } from '../controllers/chatController';

const router = Router();

// Gelen POST isteklerini Controller'a yönlendiriyoruz
router.post('/', handleChatMessage);

export default router;
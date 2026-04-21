import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login } from '../controllers/auth';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    msg: 'Demasiados intentos de inicio de sesión. Intentá de nuevo en 15 minutos.',
  },
});

const router = Router();

router.post('/login', loginLimiter, login);

export default router;

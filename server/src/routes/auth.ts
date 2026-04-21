import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login } from '../controllers/auth';
import { validate } from '../middlewares/validate';
import { loginSchema } from '../schemas/auth.schema';

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

router.post('/login', loginLimiter, validate(loginSchema), login);

export default router;

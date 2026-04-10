import { Router } from 'express';
import { getMesas } from '../controllers/mesas';
import { validateToken } from '../middlewares/validateToken';

const router = Router();

router.get('/', validateToken, getMesas);

export default router;

import { Router } from 'express';
import { validateToken } from '../middlewares/validateToken';
import { ventasDelDia } from '../controllers/reportes';

const router = Router();
router.use(validateToken);
router.get('/ventas-dia', ventasDelDia);

export default router;

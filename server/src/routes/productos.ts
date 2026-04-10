import { Router } from 'express';
import { getProductosAgrupados } from '../controllers/productos';
import { validateToken } from '../middlewares/validateToken';

const router = Router();

router.get('/', validateToken, getProductosAgrupados);

export default router;

import { Router } from 'express';
import { getProductosAgrupados } from '../controllers/productos';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';

const router = Router();

router.get('/', validateToken, authorizeRoles('mesero', 'admin'), getProductosAgrupados);

export default router;

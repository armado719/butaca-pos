import { Router } from 'express';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { ventasDelDia } from '../controllers/reportes';

const router = Router();
router.use(validateToken, authorizeRoles('admin'));

router.get('/ventas-dia', ventasDelDia);

export default router;

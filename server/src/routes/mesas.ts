import { Router } from 'express';
import { getMesas } from '../controllers/mesas';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';

const router = Router();

router.get('/', validateToken, authorizeRoles('mesero', 'admin'), getMesas);

export default router;

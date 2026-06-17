import express from 'express';
import * as peoPsoController from '../controllers/peoPsoController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT); // All routes require auth

router.get('/dept/:deptId', peoPsoController.getPeoPsoByDept);
router.put('/dept/:deptId', authorizeRoles('Admin', 'HOD'), peoPsoController.updatePeoPso);

export default router;

import express from 'express';
import * as peoController from '../controllers/peoController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', peoController.getPeos);
router.post('/', authorizeRoles('Admin', 'HOD'), peoController.createPeo);
router.put('/:id', authorizeRoles('Admin', 'HOD'), peoController.updatePeo);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), peoController.deletePeo);

export default router;

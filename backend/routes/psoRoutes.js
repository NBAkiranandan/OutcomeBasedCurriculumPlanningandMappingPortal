import express from 'express';
import * as psoController from '../controllers/psoController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', psoController.getPsos);
router.post('/', authorizeRoles('Admin', 'HOD'), psoController.createPso);
router.put('/:id', authorizeRoles('Admin', 'HOD'), psoController.updatePso);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), psoController.deletePso);

export default router;

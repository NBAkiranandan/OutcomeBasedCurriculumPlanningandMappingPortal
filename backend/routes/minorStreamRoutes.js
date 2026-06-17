import express from 'express';
import * as minorStreamController from '../controllers/minorStreamController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', minorStreamController.getMinorStreams);
router.post('/', authorizeRoles('Admin', 'HOD'), minorStreamController.createMinorStream);
router.put('/:id', authorizeRoles('Admin', 'HOD'), minorStreamController.updateMinorStream);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), minorStreamController.deleteMinorStream);

export default router;

import express from 'express';
import * as prerequisiteController from '../controllers/prerequisiteController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', prerequisiteController.getPrerequisites);
router.post('/', authorizeRoles('Admin', 'HOD'), prerequisiteController.createPrerequisite);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), prerequisiteController.deletePrerequisite);

export default router;

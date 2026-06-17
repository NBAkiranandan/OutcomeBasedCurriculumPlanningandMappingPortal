import express from 'express';
import * as regulationController from '../controllers/regulationController.js';
import { validateBody, regulationSchema } from '../validations/schemas.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT); // All routes require auth

router.get('/', regulationController.getRegulations);
router.get('/program/:programId', regulationController.getRegulationsByProgram);
router.get('/dept/:departmentId', regulationController.getRegulationsByDept);
router.post('/', authorizeRoles('Admin', 'HOD'), validateBody(regulationSchema), regulationController.createRegulation);

// PEO & PSO mapping endpoints - HOD & Admin

router.put('/:id', authorizeRoles('Admin', 'HOD'), regulationController.updateRegulation);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), regulationController.deleteRegulation);

export default router;

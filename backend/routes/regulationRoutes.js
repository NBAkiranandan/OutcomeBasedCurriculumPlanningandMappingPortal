import express from 'express';
import * as regulationController from '../controllers/regulationController.js';
import { validateBody, regulationSchema } from '../validations/schemas.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT); // All routes require auth

// READ routes
router.get('/', regulationController.getRegulations);
router.get('/deleted', authorizeRoles('Admin'), regulationController.getDeletedRegulations);
router.get('/program/:programId', regulationController.getRegulationsByProgram);
router.get('/dept/:departmentId', regulationController.getRegulationsByDept);

// CREATE
router.post('/', authorizeRoles('Admin', 'HOD'), validateBody(regulationSchema), regulationController.createRegulation);

// LIFECYCLE TRANSITION — Admin only
router.post('/:id/status', authorizeRoles('Admin'), regulationController.transitionRegulationStatus);

// DELETION / RESTORE
router.get('/:id/deletion-stats', authorizeRoles('Admin'), regulationController.getRegulationDeletionStats);
router.post('/:id/restore', authorizeRoles('Admin'), regulationController.restoreRegulation);

// GENERAL UPDATE (field edit) — Admin or HOD (controller enforces status guard)
router.put('/:id', authorizeRoles('Admin', 'HOD'), regulationController.updateRegulation);

// SOFT DELETE
router.delete('/:id', authorizeRoles('Admin'), regulationController.deleteRegulation);

export default router;

import express from 'express';
import * as programController from '../controllers/programController.js';
import { validateBody, programSchema, departmentSchema } from '../validations/schemas.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT); // All routes require auth

router.get('/', programController.getPrograms);
router.post('/', authorizeRoles('Admin'), validateBody(programSchema), programController.createProgram);

router.get('/departments', programController.getDepartments);
router.get('/:programId/departments', programController.getDepartmentsByProgram);
router.post('/departments', authorizeRoles('Admin'), validateBody(departmentSchema), programController.createDepartment);
router.put('/departments/:id', authorizeRoles('Admin'), programController.updateDepartment);
router.post('/departments/:id/assign-hod', authorizeRoles('Admin'), programController.assignHod);
router.delete('/departments/:id', authorizeRoles('Admin'), programController.deleteDepartment);

router.put('/:id', authorizeRoles('Admin'), programController.updateProgram);
router.delete('/:id', authorizeRoles('Admin'), programController.deleteProgram);

export default router;

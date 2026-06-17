import express from 'express';
import * as courseAssignmentController from '../controllers/courseAssignmentController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', courseAssignmentController.getAssignments);
router.post('/', authorizeRoles('Admin', 'HOD'), courseAssignmentController.createAssignment);
router.put('/:id', authorizeRoles('Admin', 'HOD'), courseAssignmentController.updateAssignment);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), courseAssignmentController.deleteAssignment);

export default router;

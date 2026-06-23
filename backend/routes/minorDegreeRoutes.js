import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import * as minorDegreeController from '../controllers/minorDegreeController.js';

const router = express.Router();
router.use(authenticateJWT);

// GET endpoints
router.get('/', minorDegreeController.getMinorDegrees);
router.get('/all-published', minorDegreeController.getAllPublished);
router.get('/:id', minorDegreeController.getMinorDegree);

// Minor Degree CRUD (Admin, HOD)
router.post('/', authorizeRoles('Admin', 'HOD'), minorDegreeController.createMinorDegree);
router.put('/:id', authorizeRoles('Admin', 'HOD'), minorDegreeController.updateMinorDegree);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), minorDegreeController.deleteMinorDegree);

// Publish endpoint
router.post('/:id/publish', authorizeRoles('Admin', 'HOD'), minorDegreeController.publishMinorDegree);

// Minor Degree Courses CRUD (Admin, HOD)
router.post('/:minorDegreeId/courses', authorizeRoles('Admin', 'HOD'), minorDegreeController.addCourse);
router.put('/courses/:id', authorizeRoles('Admin', 'HOD'), minorDegreeController.updateCourse);
router.delete('/courses/:id', authorizeRoles('Admin', 'HOD'), minorDegreeController.deleteCourse);

export default router;

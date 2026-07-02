import express from 'express';
import * as minorStreamController from '../controllers/minorStreamController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', minorStreamController.getMinorStreams);
router.post('/', authorizeRoles('Admin', 'HOD'), minorStreamController.createMinorStream);
router.put('/:id', authorizeRoles('Admin', 'HOD'), minorStreamController.updateMinorStream);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), minorStreamController.deleteMinorStream);

// Minor Stream Courses CRUD (Admin, HOD)
router.post('/:minorStreamId/courses', authorizeRoles('Admin', 'HOD'), minorStreamController.addStreamCourse);
router.put('/courses/:id', authorizeRoles('Admin', 'HOD'), minorStreamController.updateStreamCourse);
router.delete('/courses/:id', authorizeRoles('Admin', 'HOD'), minorStreamController.deleteStreamCourse);

export default router;

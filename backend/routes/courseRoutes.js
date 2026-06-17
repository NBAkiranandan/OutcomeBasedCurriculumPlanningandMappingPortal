import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { 
  validateBody, 
  courseSchema, 
  assignCoordinatorSchema, 
  updateCourseVersionSchema, 
  updateWorkflowSchema 
} from '../validations/schemas.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT); // All routes require auth

// Course file coordinator assignment
router.post('/assign', authorizeRoles('Admin', 'HOD'), validateBody(assignCoordinatorSchema), courseController.assignCoordinator);

// Create new course
router.post('/', authorizeRoles('Admin', 'HOD'), validateBody(courseSchema), courseController.createCourse);

// Curriculum structures
router.get('/regulation/:regulationId', courseController.getVersionsByRegulation);

// Course listings
router.get('/', courseController.getAllCourses);
router.get('/dept/:departmentId', courseController.getCoursesByDept);
router.delete('/:id', authorizeRoles('Admin', 'HOD'), courseController.deleteGlobalCourse);

// Coordinator private dashboard route
router.get('/coordinator', authorizeRoles('Coordinator'), courseController.getCoordinatorCourses);

// Download endpoints (before /:id routes to prevent catching)
router.get('/download/pdf', courseController.downloadOriginalPDF);

// Specific course file actions (order matters - more specific routes first)
router.delete('/version/:id', authorizeRoles('Admin', 'HOD'), courseController.deleteCourseVersion);
router.get('/version/:id/download-word', courseController.downloadCourseWord);
router.get('/version/:id', courseController.getVersionById);
router.put('/version/:id/status', validateBody(updateWorkflowSchema), courseController.updateWorkflow);
router.put('/version/:id', validateBody(updateCourseVersionSchema), courseController.updateSyllabusDraft);

export default router;

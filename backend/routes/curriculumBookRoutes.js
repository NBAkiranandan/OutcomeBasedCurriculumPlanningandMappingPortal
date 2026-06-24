import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import * as curriculumBookController from '../controllers/curriculumBookController.js';


const router = express.Router();
router.use(authenticateJWT);

router.get('/reviews', authorizeRoles('HOD', 'Admin', 'Faculty'), curriculumBookController.listReviewStatuses);
router.put('/reviews/status', authorizeRoles('Admin', 'HOD'), curriculumBookController.updateReviewStatus);
router.post('/export/pdf', authorizeRoles('HOD', 'Admin', 'Coordinator', 'Faculty'), curriculumBookController.exportPdf);
router.get('/export/docx', authorizeRoles('HOD', 'Admin', 'Coordinator', 'Faculty'), curriculumBookController.exportDocx);

export default router;

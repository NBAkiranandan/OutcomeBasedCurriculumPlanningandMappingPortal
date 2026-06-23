import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import * as curriculumBookController from '../controllers/curriculumBookController.js';


const router = express.Router();
router.use(authenticateJWT);

router.post('/export/pdf', authorizeRoles('HOD', 'Admin', 'Coordinator'), curriculumBookController.exportPdf);
router.get('/export/docx', authorizeRoles('HOD', 'Admin', 'Coordinator'), curriculumBookController.exportDocx);

export default router;

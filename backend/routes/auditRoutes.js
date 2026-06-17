import express from 'express';
import * as auditController from '../controllers/auditController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles('Admin'));

router.get('/', auditController.getAuditLogs);

export default router;

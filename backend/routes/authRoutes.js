import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateBody, loginSchema, changePasswordSchema } from '../validations/schemas.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public auth routes
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);

// Protected auth routes
router.post('/logout', authenticateJWT, authController.logout);
router.get('/profile', authenticateJWT, authController.getProfile);
router.get('/faculty', authenticateJWT, authorizeRoles('Admin', 'HOD'), authController.getFaculty);
router.get('/my-department', authenticateJWT, authorizeRoles('HOD'), authController.getMyDepartment);
router.post('/change-password', authenticateJWT, validateBody(changePasswordSchema), authController.changePassword);

export default router;

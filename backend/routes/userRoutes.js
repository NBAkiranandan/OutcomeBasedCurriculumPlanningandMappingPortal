import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles('Admin', 'HOD'));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.post('/bulk', userController.createBulkUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;

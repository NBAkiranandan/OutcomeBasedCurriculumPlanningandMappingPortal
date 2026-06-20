import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/courseCategoryController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', authenticateJWT, authorizeRoles('Admin', 'HOD'), createCategory);
router.put('/:id', authenticateJWT, authorizeRoles('Admin', 'HOD'), updateCategory);
router.delete('/:id', authenticateJWT, authorizeRoles('Admin', 'HOD'), deleteCategory);

export default router;

import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT); // All routes require auth

router.get('/', notificationController.getNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;

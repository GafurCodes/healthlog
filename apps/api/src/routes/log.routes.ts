import { Router } from 'express';
import * as logController from '../controllers/log.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All log routes require authentication
router.use(requireAuth);

// GET /api/logs - Search/list logs with pagination
router.get('/', logController.searchLogs);

// POST /api/logs - Create new log
router.post('/', logController.createLog);

// GET /api/logs/:id - Get single log
router.get('/:id', logController.getLog);

// PUT /api/logs/:id - Update log
router.put('/:id', logController.updateLog);

// DELETE /api/logs/:id - Delete log
router.delete('/:id', logController.deleteLog);

export default router;

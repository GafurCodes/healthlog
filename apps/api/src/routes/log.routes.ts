import { Router } from 'express';
import * as logController from '../controllers/log.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', logController.searchLogs);

router.get('/daily-calories', logController.getDailyCalories);

router.post('/', logController.createLog);

router.get('/:id', logController.getLog);

router.put('/:id', logController.updateLog);

router.delete('/:id', logController.deleteLog);

export default router;

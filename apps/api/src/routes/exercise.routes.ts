import { Router } from 'express';
import {
  searchExerciseHandler,
  estimateExerciseHandler,
  lookupExerciseHandler,
} from '../controllers/exercise.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/search', requireAuth, searchExerciseHandler);
router.post('/estimate', requireAuth, estimateExerciseHandler);
router.post('/lookup', requireAuth, lookupExerciseHandler);

export default router;

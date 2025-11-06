import { Router } from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', profileController.getProfile);

router.post('/', profileController.createOrUpdateProfile);

router.put('/', profileController.createOrUpdateProfile);

router.delete('/', profileController.deleteProfile);

export default router;

import { Router } from "express";
import * as nutritionController from "../controllers/nutrition.controller.js";
//import { requireAuth } from "../middleware/auth.js";
const router = Router();

//router.use(requireAuth);

router.post("/maintenance-calories", nutritionController.calculateMaintenanceCaloriesHandler);

export default router;


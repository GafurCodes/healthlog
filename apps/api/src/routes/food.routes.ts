import { Router } from "express";
import * as foodController from "../controllers/food.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

//router.use(requireAuth);

router.post("/search", foodController.searchFood);

export default router;

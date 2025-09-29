import { Router } from "express";
import StatCommuneController from "../controllers/StatCommuneController.js";

const router = Router();

// GET /api/statcommunes
router.get("/statcommunes", StatCommuneController.getStatCommunes);

export default router;
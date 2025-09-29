// routes/statsituationRoutes.js
import { Router } from "express";
import StatsituationController from "../controllers/StatsituationController.js";

const router = Router();

// GET /api/statsituations
router.get("/statsituations", StatsituationController.getStatsituations);

export default router;

import { Router } from "express";
import StatDescentesController from "../controllers/StatDescentesController.js";

const router = Router();

// GET /api/descentes-par-mois?annee=2025
router.get("/descentes-par-mois", StatDescentesController.fetchDossiersParMois);

export default router;

import { Router } from "express";
import DemandePCController from "../controllers/DemandePCController.js"; 

const router = Router();

// GET toutes les demandes
router.get("/", DemandePCController.getAllDemandes);

export default router;

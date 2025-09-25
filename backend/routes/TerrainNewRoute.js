import express from "express";
import { createTerrain, getAllTerrains } from "../controllers/TerrainNewControlleur.js"; // ← le contrôleur

const router = express.Router();

// Créer un nouveau terrain
router.post("/", createTerrain);

// Récupérer tous les terrains
router.get("/", getAllTerrains);

export default router;

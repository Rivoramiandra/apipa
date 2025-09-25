import express from "express";
import TerrainController from "../controllers/TerrainController.js";

const router = express.Router();

router.get("/terrains", TerrainController.getTerrains);

export default router;

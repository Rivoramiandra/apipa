import express from "express";
import RemblaiController from "../controllers/remblaiController.js";

const router = express.Router();

router.get("/remblai", RemblaiController.getTerrains); // Corrected this line

export default router;
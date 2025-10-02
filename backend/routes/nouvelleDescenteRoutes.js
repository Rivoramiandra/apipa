import express from "express";
import NouvelleDescenteController from "../controllers/nouvelleDescenteController.js";

const router = express.Router();

// ✅ Créer une nouvelle descente
router.post("/descentes", (req, res) => {
  console.log("🔔 Route /descente appelée !");
  console.log("Body reçu :", req.body); // Vérifie que le body arrive bien
  NouvelleDescenteController.create(req, res);
});

export default router;

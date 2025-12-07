// controllers/remblaiController.js
import RemblaiModel from "../models/RemblaiModel.js";

class RemblaiController {
  static async getAllRemblai(req, res) {  // CHANGER LE NOM DE getTerrains À getAllRemblai
    try {
      const terrains = await RemblaiModel.getAllRemblai();
      res.json(terrains);
    } catch (error) {
      console.error("❌ Erreur dans getAllRemblai:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Garder l'ancienne méthode pour la compatibilité
  static async getTerrains(req, res) {
    try {
      const terrains = await RemblaiModel.getAllRemblai();
      res.json(terrains);
    } catch (error) {
      console.error("❌ Erreur dans getTerrains:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default RemblaiController;
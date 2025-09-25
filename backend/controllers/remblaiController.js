// controllers/remblaiController.js
import RemblaiModel from "../models/RemblaiModel.js";

class RemblaiController {
  static async getTerrains(req, res) {
    try {
      const terrains = await RemblaiModel.getAllRemblai();
      res.json(terrains); // ✅ on renvoie bien le tableau récupéré
    } catch (error) {
      console.error("❌ Erreur dans getTerrains:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default RemblaiController;

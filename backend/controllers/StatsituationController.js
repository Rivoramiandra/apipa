// controllers/StatsituationController.js
import StatsituationModel from "../models/StatsituationModel.js";

class StatsituationController {
  static async getStatsituations(req, res) {
    try {
      const data = await StatsituationModel.getStatsituations();
      res.status(200).json(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des statisituations :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
}

export default StatsituationController;

import DemandePCModel from "../models/DemandePCModel.js";

class DemandePCController {
  // Récupérer toutes les demandes
  static async getAllDemandes(req, res) {
    try {
      const demandes = await DemandePCModel.getAllDemandes();
      res.status(200).json(demandes);
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
}

export default DemandePCController;

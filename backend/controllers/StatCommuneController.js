import StatCommuneModel from "../models/StatCommuneModel.js";

class StatCommuneController {
    static async getStatCommunes(req, res) {
        try {
            const data = await StatCommuneModel.getStatCommunes();
            // L'API renverra un tableau d'objets : [{nom_commune: '...', nombre: X}, ...]
            res.status(200).json(data);
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques par commune :", error);
            res.status(500).json({ message: "Erreur serveur lors de la récupération des données de commune." });
        }
    }
}

export default StatCommuneController;
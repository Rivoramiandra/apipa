import StatDescentesModel from "../models/StatDescentesModel.js";

class StatDescentesController {

    static async fetchDossiersParMois(req, res) {
        try {
            const { annee } = req.query; // exemple: ?annee=2025
            const data = await StatDescentesModel.getDossiersParMois(annee);
            res.status(200).json(data);
        } catch (error) {
            console.error('Erreur lors de la récupération des dossiers par mois :', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
}

export default StatDescentesController;

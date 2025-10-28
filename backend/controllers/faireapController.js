import ApModel from '../models/ApModel.js';

class FaireAPController {
    
    static async getAllAP(req, res) {
        try {
            console.log('🔄 FaireAPController.getAllAP: Récupération de tous les AP');
            
            const apList = await ApModel.getAllAP();
            
            res.json({
                success: true,
                message: 'Liste des avis de paiement récupérée avec succès',
                data: apList
            });
            
        } catch (error) {
            console.error('Erreur dans FaireAPController.getAllAP:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async createAP(req, res) {
        try {
            const apData = req.body;
            
            console.log('🔄 FaireAPController.createAP: Données reçues:', apData);
            
            if (!apData.num_ap || !apData.date_ap) {
                return res.status(400).json({
                    success: false,
                    message: 'Numéro AP et date AP sont requis'
                });
            }

            const newAP = await ApModel.create(apData);
            
            res.status(201).json({
                success: true,
                message: 'Avis de paiement créé avec succès',
                data: newAP
            });
            
        } catch (error) {
            console.error('Erreur dans FaireAPController.createAP:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default FaireAPController;
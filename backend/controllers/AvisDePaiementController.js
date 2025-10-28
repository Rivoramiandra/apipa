import AvisDePaiementModel from '../models/AvisDePaiementModel.js';

class AvisDePaiementController {
  static async createAP(req, res) {
    try {
      const apData = req.body;
      
      // Validation des données requises
      if (!apData.date_ap || !apData.ref_ap || !apData.proprietaire || !apData.montant) {
        return res.status(400).json({
          success: false,
          message: 'Les champs date_ap, ref_ap, proprietaire et montant sont obligatoires'
        });
      }

      // Vérifier si la référence existe déjà
      const referenceExists = await AvisDePaiementModel.checkReferenceExists(apData.ref_ap);
      if (referenceExists) {
        return res.status(400).json({
          success: false,
          message: 'Cette référence d\'avis de paiement existe déjà'
        });
      }

      // Création de l'avis de paiement
      const newAP = await AvisDePaiementModel.create(apData);
      
      res.status(201).json({
        success: true,
        message: 'Avis de paiement créé avec succès',
        data: newAP
      });
      
    } catch (error) {
      console.error('Erreur création avis de paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'avis de paiement',
        error: error.message
      });
    }
  }

  static async getAllAP(req, res) {
    try {
      const allAP = await AvisDePaiementModel.findAll();
      res.json({
        success: true,
        data: allAP
      });
    } catch (error) {
      console.error('Erreur récupération avis de paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des avis de paiement',
        error: error.message
      });
    }
  }

  static async getAPById(req, res) {
    try {
      const { id } = req.params;
      const ap = await AvisDePaiementModel.findById(id);
      
      if (!ap) {
        return res.status(404).json({
          success: false,
          message: 'Avis de paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: ap
      });
    } catch (error) {
      console.error('Erreur récupération avis de paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'avis de paiement',
        error: error.message
      });
    }
  }

  static async getAPByReference(req, res) {
    try {
      const { ref_ap } = req.params;
      const ap = await AvisDePaiementModel.findByReference(ref_ap);
      
      if (!ap) {
        return res.status(404).json({
          success: false,
          message: 'Avis de paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: ap
      });
    } catch (error) {
      console.error('Erreur récupération avis de paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'avis de paiement',
        error: error.message
      });
    }
  }

  static async updateAP(req, res) {
    try {
      const { id } = req.params;
      const apData = req.body;
      
      const updatedAP = await AvisDePaiementModel.update(id, apData);
      
      if (!updatedAP) {
        return res.status(404).json({
          success: false,
          message: 'Avis de paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Avis de paiement mis à jour avec succès',
        data: updatedAP
      });
    } catch (error) {
      console.error('Erreur mise à jour avis de paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'avis de paiement',
        error: error.message
      });
    }
  }

  static async updateAPStatus(req, res) {
    try {
      const { id } = req.params;
      const { etat } = req.body;
      
      if (!etat) {
        return res.status(400).json({
          success: false,
          message: 'Le champ etat est obligatoire'
        });
      }
      
      const updatedAP = await AvisDePaiementModel.updateStatus(id, etat);
      
      if (!updatedAP) {
        return res.status(404).json({
          success: false,
          message: 'Avis de paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: updatedAP
      });
    } catch (error) {
      console.error('Erreur mise à jour statut avis de paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    }
  }

  static async updateMontantRecouvri(req, res) {
    try {
      const { id } = req.params;
      const { montantarecouvrir } = req.body;
      
      if (montantarecouvrir === undefined || montantarecouvrir === null) {
        return res.status(400).json({
          success: false,
          message: 'Le champ montantarecouvrir est obligatoire'
        });
      }
      
      const updatedAP = await AvisDePaiementModel.updateMontantRecouvri(id, montantarecouvrir);
      
      if (!updatedAP) {
        return res.status(404).json({
          success: false,
          message: 'Avis de paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Montant recouvri mis à jour avec succès',
        data: updatedAP
      });
    } catch (error) {
      console.error('Erreur mise à jour montant recouvri:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du montant recouvri',
        error: error.message
      });
    }
  }

  static async deleteAP(req, res) {
    try {
      const { id } = req.params;
      
      const deletedAP = await AvisDePaiementModel.delete(id);
      
      if (!deletedAP) {
        return res.status(404).json({
          success: false,
          message: 'Avis de paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Avis de paiement supprimé avec succès',
        data: deletedAP
      });
    } catch (error) {
      console.error('Erreur suppression avis de paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'avis de paiement',
        error: error.message
      });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await AvisDePaiementModel.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur récupération stats avis de paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

export default AvisDePaiementController;
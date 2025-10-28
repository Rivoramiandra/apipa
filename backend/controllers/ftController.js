// controllers/ftController.js
import FtModel from '../models/FtModel.js';

class FtController {
  static async createFT(req, res) {
    try {
      const ftData = req.body;
      
      // Validation des données requises
      if (!ftData.rendezvous_id || !ftData.reference_ft) {
        return res.status(400).json({
          success: false,
          message: 'Les champs rendezvous_id et reference_ft sont obligatoires'
        });
      }

      // Création du FT avec toutes les données
      const newFT = await FtModel.create(ftData);
      
      res.status(201).json({
        success: true,
        message: 'F.T. créé avec succès',
        data: newFT
      });
      
    } catch (error) {
      console.error('Erreur création F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du F.T.',
        error: error.message
      });
    }
  }

  static async getAllFT(req, res) {
    try {
      const allFT = await FtModel.findAll();
      res.json({
        success: true,
        data: allFT
      });
    } catch (error) {
      console.error('Erreur récupération F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des F.T.',
        error: error.message
      });
    }
  }

  static async getFTById(req, res) {
    try {
      const { id } = req.params;
      const ft = await FtModel.findById(id);
      
      if (!ft) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: ft
      });
    } catch (error) {
      console.error('Erreur récupération F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du F.T.',
        error: error.message
      });
    }
  }

  static async getFTByRendezvousId(req, res) {
    try {
      const { rendezvousId } = req.params;
      const ft = await FtModel.findByRendezvousId(rendezvousId);
      
      res.json({
        success: true,
        data: ft
      });
    } catch (error) {
      console.error('Erreur récupération F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des F.T.',
        error: error.message
      });
    }
  }

  static async updateFTStatus(req, res) {
    try {
      const { id } = req.params;
      const { status_dossier } = req.body;
      
      if (!status_dossier) {
        return res.status(400).json({
          success: false,
          message: 'Le champ status_dossier est obligatoire'
        });
      }
      
      const updatedFT = await FtModel.updateStatus(id, status_dossier);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: updatedFT
      });
    } catch (error) {
      console.error('Erreur mise à jour statut F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    }
  }

  static async updateMissingDossiers(req, res) {
    try {
      const { id } = req.params;
      const { missing_dossiers } = req.body;
      
      const updatedFT = await FtModel.updateMissingDossiers(id, missing_dossiers);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Dossiers manquants mis à jour avec succès',
        data: updatedFT
      });
    } catch (error) {
      console.error('Erreur mise à jour dossiers manquants:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des dossiers manquants',
        error: error.message
      });
    }
  }

  static async addMissingDossier(req, res) {
    try {
      const { id } = req.params;
      const { dossier } = req.body;
      
      if (!dossier) {
        return res.status(400).json({
          success: false,
          message: 'Le champ dossier est obligatoire'
        });
      }
      
      const updatedFT = await FtModel.addMissingDossier(id, dossier);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Dossier manquant ajouté avec succès',
        data: updatedFT
      });
    } catch (error) {
      console.error('Erreur ajout dossier manquant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du dossier manquant',
        error: error.message
      });
    }
  }

  static async removeMissingDossier(req, res) {
    try {
      const { id, dossier } = req.params;
      
      // Implémentez cette méthode dans votre modèle si nécessaire
      // const updatedFT = await FtModel.removeMissingDossier(id, dossier);
      
      res.status(501).json({
        success: false,
        message: 'Fonctionnalité non implémentée'
      });
    } catch (error) {
      console.error('Erreur suppression dossier manquant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du dossier manquant',
        error: error.message
      });
    }
  }

  static async clearMissingDossiers(req, res) {
    try {
      const { id } = req.params;
      
      const updatedFT = await FtModel.clearMissingDossiers(id);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Dossiers manquants vidés avec succès',
        data: updatedFT
      });
    } catch (error) {
      console.error('Erreur vidage dossiers manquants:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du vidage des dossiers manquants',
        error: error.message
      });
    }
  }

  static async deleteFT(req, res) {
    try {
      const { id } = req.params;
      
      const deletedFT = await FtModel.delete(id);
      
      if (!deletedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'F.T. supprimé avec succès',
        data: deletedFT
      });
    } catch (error) {
      console.error('Erreur suppression F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du F.T.',
        error: error.message
      });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await FtModel.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur récupération stats F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

export default FtController;
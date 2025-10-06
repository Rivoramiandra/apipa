// controllers/rendezvousController.js
import RendezvousModel from '../models/rendezvousModel.js';

class RendezvousController {
  // Récupérer tous les rendez-vous
  getAllRendezvous = async (req, res) => {
    try {
      const rendezvous = await RendezvousModel.getAllRendezvous();
      res.json({
        success: true,
        data: rendezvous,
        count: rendezvous.length
      });
    } catch (error) {
      console.error('Erreur dans getAllRendezvous:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des rendez-vous',
        error: error.message
      });
    }
  }

  // Récupérer un rendez-vous par ID
  getRendezvousById = async (req, res) => {
    try {
      const { id } = req.params;
      const rendezvous = await RendezvousModel.getRendezvousById(id);
      
      if (!rendezvous) {
        return res.status(404).json({
          success: false,
          message: 'Rendez-vous non trouvé'
        });
      }

      res.json({
        success: true,
        data: rendezvous
      });
    } catch (error) {
      console.error('Erreur dans getRendezvousById:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du rendez-vous',
        error: error.message
      });
    }
  }

  // Rechercher des rendez-vous
  searchRendezvous = async (req, res) => {
    try {
      const { term } = req.params;
      
      if (!term || term.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Le terme de recherche doit contenir au moins 2 caractères'
        });
      }

      const rendezvous = await RendezvousModel.searchRendezvous(term.trim());
      
      res.json({
        success: true,
        data: rendezvous,
        count: rendezvous.length,
        searchTerm: term
      });
    } catch (error) {
      console.error('Erreur dans searchRendezvous:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la recherche des rendez-vous',
        error: error.message
      });
    }
  }

  // Mettre à jour le statut
  updateStatut = async (req, res) => {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      if (!statut) {
        return res.status(400).json({
          success: false,
          message: 'Le champ statut est requis'
        });
      }

      const updated = await RendezvousModel.updateStatut(id, statut);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Rendez-vous non trouvé'
        });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Statut mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur dans updateStatut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du statut',
        error: error.message
      });
    }
  }

  // Récupérer les statistiques
  getRendezvousStats = async (req, res) => {
    try {
      const stats = await RendezvousModel.getRendezvousStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur dans getRendezvousStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

export default new RendezvousController;
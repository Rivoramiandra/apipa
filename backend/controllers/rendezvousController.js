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
  // Envoyer une mise en demeure
  sendMiseEnDemeure = async (req, res) => {
    try {
      const { id } = req.params;
      const { nouvelle_date, nouvelle_heure } = req.body;

      // Vérifier si le rendez-vous existe et est éligible
      const eligibility = await RendezvousModel.isEligibleForMiseEnDemeure(id);
      
      if (!eligibility.rendezvous) {
        return res.status(404).json({
          success: false,
          message: 'Rendez-vous non trouvé ou déjà traité'
        });
      }

      if (!eligibility.eligible) {
        return res.status(400).json({
          success: false,
          message: 'Ce rendez-vous n\'est pas encore éligible pour une mise en demeure (7 jours requis après la date du rendez-vous)'
        });
      }

      // Valider la nouvelle date si fournie
      if (nouvelle_date) {
        const newDate = new Date(nouvelle_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (newDate < today) {
          return res.status(400).json({
            success: false,
            message: 'La nouvelle date de rendez-vous ne peut pas être dans le passé'
          });
        }
      }

      // Envoyer la mise en demeure
      const updated = await RendezvousModel.sendMiseEnDemeure(
        id, 
        nouvelle_date || null, 
        nouvelle_heure || null
      );

      res.json({
        success: true,
        data: updated,
        message: 'Mise en demeure envoyée avec succès. Le statut est maintenant "En cours".'
      });
    } catch (error) {
      console.error('Erreur dans sendMiseEnDemeure:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'envoi de la mise en demeure',
        error: error.message
      });
    }
  }

  // Récupérer les rendez-vous éligibles pour mise en demeure
  getEligibleForMiseEnDemeure = async (req, res) => {
    try {
      const eligibleRendezvous = await RendezvousModel.getRendezvousEligibleForMiseEnDemeure();
      
      res.json({
        success: true,
        data: eligibleRendezvous,
        count: eligibleRendezvous.length
      });
    } catch (error) {
      console.error('Erreur dans getEligibleForMiseEnDemeure:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des rendez-vous éligibles',
        error: error.message
      });
    }
  }

  // Vérifier l'éligibilité d'un rendez-vous spécifique
  checkEligibility = async (req, res) => {
    try {
      const { id } = req.params;
      const eligibility = await RendezvousModel.isEligibleForMiseEnDemeure(id);
      
      if (!eligibility.rendezvous) {
        return res.status(404).json({
          success: false,
          message: 'Rendez-vous non trouvé'
        });
      }

      res.json({
        success: true,
        data: {
          eligible: eligibility.eligible,
          rendezvous: eligibility.rendezvous,
          message: eligibility.eligible 
            ? 'Rendez-vous éligible pour mise en demeure' 
            : 'Rendez-vous non éligible (7 jours requis après la date du rendez-vous)'
        }
      });
    } catch (error) {
      console.error('Erreur dans checkEligibility:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification d\'éligibilité',
        error: error.message
      });
    }
  }
}

export default new RendezvousController;
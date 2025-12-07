// controllers/rendezvousController.js
import RendezvousModel from '../models/rendezvousModel.js';

class RendezvousController {
  // Créer un rendez-vous à partir d'une descente
  createFromDescente = async (req, res) => {
    try {
      const { descenteId } = req.params;
      const descenteData = req.body;

      // Vérifier si la descente a déjà un rendez-vous
      const hasRendezvous = await RendezvousModel.checkDescenteHasRendezvous(descenteId);
      
      if (hasRendezvous) {
        return res.status(400).json({
          success: false,
          message: 'Cette descente a déjà un rendez-vous associé'
        });
      }

      const rendezvous = await RendezvousModel.createFromDescente({
        n: descenteId,
        ...descenteData
      });

      res.status(201).json({
        success: true,
        data: rendezvous,
        message: 'Rendez-vous créé avec succès'
      });
    } catch (error) {
      console.error('Erreur dans createFromDescente:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création du rendez-vous',
        error: error.message
      });
    }
  }

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

  // Récupérer les rendez-vous par ID de descente
  getRendezvousByDescenteId = async (req, res) => {
    try {
      const { descenteId } = req.params;
      const rendezvous = await RendezvousModel.getRendezvousByDescenteId(descenteId);
      
      res.json({
        success: true,
        data: rendezvous,
        count: rendezvous.length
      });
    } catch (error) {
      console.error('Erreur dans getRendezvousByDescenteId:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des rendez-vous de la descente',
        error: error.message
      });
    }
  }

  // Vérifier si une descente a un rendez-vous
  checkDescenteHasRendezvous = async (req, res) => {
    try {
      const { descenteId } = req.params;
      const hasRendezvous = await RendezvousModel.checkDescenteHasRendezvous(descenteId);
      
      res.json({
        success: true,
        data: { hasRendezvous },
        message: hasRendezvous 
          ? 'Cette descente a déjà un rendez-vous' 
          : 'Cette descente n\'a pas de rendez-vous'
      });
    } catch (error) {
      console.error('Erreur dans checkDescenteHasRendezvous:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification',
        error: error.message
      });
    }
  }

  // Mettre à jour le statut d'un rendez-vous
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

      res.json({
        success: true,
        data: updated,
        message: 'Statut mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur dans updateStatut:', error);
      if (error.message === 'Rendez-vous non trouvé') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du statut',
        error: error.message
      });
    }
  }

  // Mettre à jour complètement un rendez-vous
  updateRendezvous = async (req, res) => {
    try {
      const { id } = req.params;
      const rendezvousData = req.body;

      const updated = await RendezvousModel.update(id, rendezvousData);

      res.json({
        success: true,
        data: updated,
        message: 'Rendez-vous mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur dans updateRendezvous:', error);
      if (error.message === 'Rendez-vous non trouvé') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du rendez-vous',
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

  // Récupérer les statistiques des rendez-vous
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

  // Supprimer un rendez-vous
  deleteRendezvous = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await RendezvousModel.delete(id);

      res.json({
        success: true,
        data: deleted,
        message: 'Rendez-vous supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur dans deleteRendezvous:', error);
      if (error.message === 'Rendez-vous non trouvé') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression du rendez-vous',
        error: error.message
      });
    }
  }

  // Récupérer les statuts disponibles
  getAvailableStatuts = async (req, res) => {
    try {
      const statuts = await RendezvousModel.getAvailableStatuts();
      
      res.json({
        success: true,
        data: statuts
      });
    } catch (error) {
      console.error('Erreur dans getAvailableStatuts:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des statuts',
        error: error.message
      });
    }
  }
}

export default new RendezvousController();
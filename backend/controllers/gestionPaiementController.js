import GestionPaiementModel from '../models/gestionPaiementModel.js';

class GestionPaiementController {
  static async createPaiement(req, res) {
    try {
      const paiementData = req.body;
      
      console.log('📥 Données reçues pour création paiement:', paiementData);

      // Validation des données requises
      if (!paiementData.ap_id || !paiementData.date_payment || !paiementData.montant) {
        return res.status(400).json({
          success: false,
          message: 'Les champs ap_id, date_payment et montant sont obligatoires'
        });
      }

      // Validation du type de paiement
      if (paiementData.payment_type === 'tranche') {
        if (!paiementData.nombre_tranches || !paiementData.montant_tranche || !paiementData.numero_tranche) {
          return res.status(400).json({
            success: false,
            message: 'Pour les paiements en tranche, les champs nombre_tranches, montant_tranche et numero_tranche sont obligatoires'
          });
        }
      }

      // Vérifier si la référence existe déjà
      if (paiementData.reference_payment) {
        const referenceExists = await GestionPaiementModel.checkReferenceExists(paiementData.reference_payment);
        if (referenceExists) {
          return res.status(400).json({
            success: false,
            message: 'Cette référence de paiement existe déjà'
          });
        }
      }

      // Validation du montant
      if (isNaN(parseFloat(paiementData.montant)) || parseFloat(paiementData.montant) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être un nombre positif'
        });
      }

      // Création du paiement
      const newPaiement = await GestionPaiementModel.create(paiementData);
      
      console.log('✅ Paiement créé avec succès:', newPaiement);

      res.status(201).json({
        success: true,
        message: 'Paiement créé avec succès',
        data: newPaiement,
        statut_calcule: newPaiement.statut
      });
      
    } catch (error) {
      console.error('❌ Erreur création paiement:', error);
      
      // Gestion des erreurs spécifiques PostgreSQL
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'AP non trouvé - violation de clé étrangère'
        });
      }
      
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Violation de contrainte unique'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du paiement',
        error: error.message
      });
    }
  }

  static async getAllPaiements(req, res) {
    try {
      const allPaiements = await GestionPaiementModel.findAll();
      
      console.log(`📊 ${allPaiements.length} paiements récupérés`);

      res.json({
        success: true,
        count: allPaiements.length,
        data: allPaiements
      });
    } catch (error) {
      console.error('❌ Erreur récupération paiements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
        error: error.message
      });
    }
  }

  static async getPaiementById(req, res) {
    try {
      const { id } = req.params;
      const paiement = await GestionPaiementModel.findById(id);
      
      if (!paiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: paiement
      });
    } catch (error) {
      console.error('❌ Erreur récupération paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du paiement',
        error: error.message
      });
    }
  }

  static async getPaiementsByApId(req, res) {
    try {
      const { ap_id } = req.params;
      const paiements = await GestionPaiementModel.findByApId(ap_id);
      
      console.log(`📊 ${paiements.length} paiements récupérés pour AP ${ap_id}`);

      res.json({
        success: true,
        count: paiements.length,
        data: paiements
      });
    } catch (error) {
      console.error('❌ Erreur récupération paiements par AP:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
        error: error.message
      });
    }
  }

  static async getPaiementByReference(req, res) {
    try {
      const { reference_payment } = req.params;
      const paiement = await GestionPaiementModel.findByReference(reference_payment);
      
      if (!paiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: paiement
      });
    } catch (error) {
      console.error('❌ Erreur récupération paiement par référence:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du paiement',
        error: error.message
      });
    }
  }

  static async updatePaiement(req, res) {
    try {
      const { id } = req.params;
      const paiementData = req.body;

      console.log(`🔄 Mise à jour paiement ${id}:`, paiementData);

      // Validation du montant si présent
      if (paiementData.montant && (isNaN(parseFloat(paiementData.montant)) || parseFloat(paiementData.montant) <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être un nombre positif'
        });
      }

      // Vérifier si la référence existe déjà (excluant l'ID actuel)
      if (paiementData.reference_payment) {
        const existingPaiement = await GestionPaiementModel.findByReference(paiementData.reference_payment);
        if (existingPaiement && existingPaiement.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Cette référence de paiement est déjà utilisée'
          });
        }
      }
      
      const updatedPaiement = await GestionPaiementModel.update(id, paiementData);
      
      if (!updatedPaiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      console.log('✅ Paiement mis à jour avec succès:', updatedPaiement);
      
      res.json({
        success: true,
        message: 'Paiement mis à jour avec succès',
        data: updatedPaiement
      });
    } catch (error) {
      console.error('❌ Erreur mise à jour paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du paiement',
        error: error.message
      });
    }
  }

  static async updateStatut(req, res) {
    try {
      const { id } = req.params;
      const { statut } = req.body;
      
      if (!statut) {
        return res.status(400).json({
          success: false,
          message: 'Le champ statut est obligatoire'
        });
      }

      // Validation des statuts autorisés
      const statutsAutorises = ['Partiel', 'Complété', 'Acompte', 'Annulé'];
      if (!statutsAutorises.includes(statut)) {
        return res.status(400).json({
          success: false,
          message: `Statut invalide. Statuts autorisés: ${statutsAutorises.join(', ')}`
        });
      }
      
      const updatedPaiement = await GestionPaiementModel.updateStatut(id, statut);
      
      if (!updatedPaiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      console.log(`✅ Statut paiement ${id} mis à jour: ${statut}`);
      
      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: updatedPaiement
      });
    } catch (error) {
      console.error('❌ Erreur mise à jour statut paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    }
  }

  static async updateMontant(req, res) {
    try {
      const { id } = req.params;
      const { montant } = req.body;
      
      if (montant === undefined || montant === null) {
        return res.status(400).json({
          success: false,
          message: 'Le champ montant est obligatoire'
        });
      }

      if (isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être un nombre positif'
        });
      }
      
      const updatedPaiement = await GestionPaiementModel.updateMontant(id, parseFloat(montant));
      
      if (!updatedPaiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      console.log(`✅ Montant paiement ${id} mis à jour: ${montant}`);
      
      res.json({
        success: true,
        message: 'Montant mis à jour avec succès',
        data: updatedPaiement
      });
    } catch (error) {
      console.error('❌ Erreur mise à jour montant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du montant',
        error: error.message
      });
    }
  }

  static async deletePaiement(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ Suppression paiement ${id}`);
      
      const deletedPaiement = await GestionPaiementModel.delete(id);
      
      if (!deletedPaiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      console.log('✅ Paiement supprimé avec succès:', deletedPaiement);
      
      res.json({
        success: true,
        message: 'Paiement supprimé avec succès',
        data: deletedPaiement
      });
    } catch (error) {
      console.error('❌ Erreur suppression paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du paiement',
        error: error.message
      });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await GestionPaiementModel.getStats();
      
      console.log('📊 Statistiques paiements récupérées');

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erreur récupération stats paiements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }

  static async getMontantRestant(req, res) {
    try {
      const { ap_id } = req.params;
      const montantRestant = await GestionPaiementModel.getMontantRestantByApId(ap_id);
      
      console.log(`💰 Montant restant AP ${ap_id}: ${montantRestant}`);
      
      res.json({
        success: true,
        data: { 
          ap_id: parseInt(ap_id),
          montant_restant: montantRestant 
        }
      });
    } catch (error) {
      console.error('❌ Erreur récupération montant restant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du montant restant',
        error: error.message
      });
    }
  }

  static async getPaiementsByAvisPaiement(req, res) {
    try {
      const { ap_id } = req.params;
      const paiements = await GestionPaiementModel.getPaiementsByAvisPaiement(ap_id);
      
      console.log(`📊 ${paiements.length} paiements récupérés pour AP ${ap_id}`);
      
      res.json({
        success: true,
        count: paiements.length,
        data: paiements
      });
    } catch (error) {
      console.error('❌ Erreur récupération paiements par avis:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
        error: error.message
      });
    }
  }

  static async checkReference(req, res) {
    try {
      const { reference_payment } = req.params;
      
      const exists = await GestionPaiementModel.checkReferenceExists(reference_payment);
      
      res.json({
        success: true,
        data: {
          reference_payment,
          exists
        }
      });
    } catch (error) {
      console.error('❌ Erreur vérification référence:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de la référence',
        error: error.message
      });
    }
  }

  static async test(req, res) {
    try {
      res.json({
        success: true,
        message: 'API GestionPaiement fonctionne correctement',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error('❌ Erreur test API:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  // Méthodes de statistiques avancées
  static async getStatsPaiements(req, res) {
    try {
      const stats = await GestionPaiementModel.getStatsPaiements();
      
      console.log('📊 Statistiques paiements récupérées');

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erreur récupération stats paiements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }

  static async getStatsPaiementsParMois(req, res) {
    try {
      const { annee } = req.query;
      const stats = await GestionPaiementModel.getStatsPaiementsParMois(annee);
      
      console.log(`📊 Statistiques paiements par mois récupérées pour ${annee || 'année courante'}`);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erreur récupération stats paiements par mois:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques mensuelles',
        error: error.message
      });
    }
  }

  static async getStatsPaiementsParStatut(req, res) {
    try {
      const stats = await GestionPaiementModel.getStatsPaiementsParStatut();
      
      console.log('📊 Statistiques paiements par statut récupérées');

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erreur récupération stats paiements par statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques par statut',
        error: error.message
      });
    }
  }

  static async getStatsPaiementsParMethode(req, res) {
    try {
      const stats = await GestionPaiementModel.getStatsPaiementsParMethode();
      
      console.log('📊 Statistiques paiements par méthode récupérées');

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erreur récupération stats paiements par méthode:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques par méthode',
        error: error.message
      });
    }
  }

  // Méthodes supplémentaires pour la gestion des annulations et résumés
  static async cancelPaiement(req, res) {
    try {
      const { id } = req.params;
      const { motif } = req.body;
      
      if (!motif) {
        return res.status(400).json({
          success: false,
          message: 'Le motif d\'annulation est obligatoire'
        });
      }

      console.log(`❌ Annulation paiement ${id}, motif: ${motif}`);
      
      // Utiliser updateStatut pour annuler le paiement
      const paiementAnnule = await GestionPaiementModel.updateStatut(id, 'Annulé');
      
      if (!paiementAnnule) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      console.log('✅ Paiement annulé avec succès:', paiementAnnule);
      
      res.json({
        success: true,
        message: 'Paiement annulé avec succès',
        data: paiementAnnule
      });
    } catch (error) {
      console.error('❌ Erreur annulation paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'annulation du paiement',
        error: error.message
      });
    }
  }

  static async getPaymentSummary(req, res) {
    try {
      const { ap_id } = req.params;
      
      console.log(`📋 Récupération résumé paiements AP ${ap_id}`);
      
      // Récupérer tous les paiements pour cet AP
      const paiements = await GestionPaiementModel.findByApId(ap_id);
      
      if (paiements.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aucun paiement trouvé pour cet AP'
        });
      }

      // Calculer le résumé
      const montantTotal = paiements[0].montant_total || 0;
      const montantPerçu = paiements.reduce((total, p) => {
        return total + (p.statut !== 'Annulé' ? parseFloat(p.montant) : 0);
      }, 0);
      const montantRestant = montantTotal - montantPerçu;
      
      const summary = {
        ap_id: parseInt(ap_id),
        montant_total: montantTotal,
        montant_percu: montantPerçu,
        montant_restant: montantRestant,
        nombre_paiements: paiements.length,
        paiements_completes: paiements.filter(p => p.statut === 'Complété').length,
        paiements_partiels: paiements.filter(p => p.statut === 'Partiel').length,
        paiements_acompte: paiements.filter(p => p.statut === 'Acompte').length,
        paiements_annules: paiements.filter(p => p.statut === 'Annulé').length,
        dernier_paiement: paiements[0] // Le plus récent
      };
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('❌ Erreur récupération résumé paiements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du résumé des paiements',
        error: error.message
      });
    }
  }
}

export default GestionPaiementController;
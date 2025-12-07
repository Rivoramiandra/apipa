import Paiement from '../models/Paiement.js';

class PaiementController {
  // Créer un nouveau paiement
  static async createPaiement(req, res) {
    try {
      const {
        ap_id,
        date_payment,
        method_payment,
        montant,
        reference_payment,
        notes,
        payment_type,
        montant_total,
        montant_reste,
        nombre_tranches,
        montant_tranche,
        numero_tranche,
        contact
      } = req.body;

      console.log('📥 Données reçues pour paiement:', req.body);

      // Validation des champs requis
      if (!ap_id || !date_payment || !method_payment || !montant || !payment_type) {
        return res.status(400).json({
          success: false,
          message: 'Champs requis manquants: ap_id, date_payment, method_payment, montant, payment_type'
        });
      }

      // Validation des types de données
      if (isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être un nombre positif'
        });
      }

      // Préparer les données pour l'insertion
      const paymentData = {
        ap_id: parseInt(ap_id),
        date_payment,
        method_payment,
        montant: parseFloat(montant),
        reference_payment: reference_payment || null,
        notes: notes || null,
        payment_type,
        montant_total: parseFloat(montant_total) || 0,
        montant_reste: parseFloat(montant_reste) || 0,
        nombre_tranches: nombre_tranches ? parseInt(nombre_tranches) : null,
        montant_tranche: montant_tranche ? parseFloat(montant_tranche) : null,
        numero_tranche: numero_tranche ? parseInt(numero_tranche) : 1,
        contact: contact || null
      };

      console.log('🎯 Données préparées pour insertion:', paymentData);

      // Créer le paiement (le statut sera calculé automatiquement)
      const nouveauPaiement = await Paiement.create(paymentData);

      console.log('✅ Paiement créé avec succès:', nouveauPaiement);

      res.status(201).json({
        success: true,
        message: 'Paiement enregistré avec succès',
        data: nouveauPaiement,
        statut_automatique: nouveauPaiement.statut
      });

    } catch (error) {
      console.error('❌ Erreur dans createPaiement:', error);
      
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
        message: `Erreur serveur: ${error.message}`
      });
    }
  }

  // Récupérer tous les paiements
  static async getAllPaiements(req, res) {
    try {
      const paiements = await Paiement.findAll();

      res.json({
        success: true,
        count: paiements.length,
        data: paiements
      });

    } catch (error) {
      console.error('❌ Erreur dans getAllPaiements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements'
      });
    }
  }

  // Récupérer les paiements par AP ID
  static async getPaiementsByApId(req, res) {
    try {
      const { ap_id } = req.params;

      if (!ap_id) {
        return res.status(400).json({
          success: false,
          message: 'ID AP requis'
        });
      }

      const paiements = await Paiement.findByApId(parseInt(ap_id));

      res.json({
        success: true,
        count: paiements.length,
        data: paiements
      });

    } catch (error) {
      console.error('❌ Erreur dans getPaiementsByApId:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements'
      });
    }
  }

  // Récupérer un paiement par ID
  static async getPaiementById(req, res) {
    try {
      const { id } = req.params;

      const paiement = await Paiement.findById(parseInt(id));

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
      console.error('❌ Erreur dans getPaiementById:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du paiement'
      });
    }
  }

  // Récupérer les statistiques de paiement pour un AP
  static async getPaiementStats(req, res) {
    try {
      const { ap_id } = req.params;

      if (!ap_id) {
        return res.status(400).json({
          success: false,
          message: 'ID AP requis'
        });
      }

      const totalPaid = await Paiement.getTotalPaidForAp(parseInt(ap_id));
      const paiements = await Paiement.findByApId(parseInt(ap_id));

      res.json({
        success: true,
        data: {
          total_paye: totalPaid.total_paye,
          nombre_paiements: totalPaid.nombre_paiements,
          historique_paiements: paiements,
          statut_calculé: totalPaid.statut_calculé
        }
      });

    } catch (error) {
      console.error('❌ Erreur dans getPaiementStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // Récupérer le résumé complet des paiements pour un AP
  static async getPaymentSummary(req, res) {
    try {
      const { ap_id } = req.params;

      if (!ap_id) {
        return res.status(400).json({
          success: false,
          message: 'ID AP requis'
        });
      }

      const summary = await Paiement.getPaymentSummary(parseInt(ap_id));

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('❌ Erreur dans getPaymentSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du résumé'
      });
    }
  }

  // Mettre à jour le statut d'un paiement
  static async updatePaiementStatut(req, res) {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      if (!statut) {
        return res.status(400).json({
          success: false,
          message: 'Statut requis'
        });
      }

      const paiement = await Paiement.updateStatut(parseInt(id), statut);

      if (!paiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Statut du paiement mis à jour avec succès',
        data: paiement
      });

    } catch (error) {
      console.error('❌ Erreur dans updatePaiementStatut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut'
      });
    }
  }

  // Mettre à jour un paiement
  static async updatePaiement(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const paiement = await Paiement.update(parseInt(id), updateData);

      if (!paiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Paiement mis à jour avec succès',
        data: paiement
      });

    } catch (error) {
      console.error('❌ Erreur dans updatePaiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du paiement'
      });
    }
  }

  // Supprimer un paiement
  static async deletePaiement(req, res) {
    try {
      const { id } = req.params;

      const paiement = await Paiement.delete(parseInt(id));

      if (!paiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Paiement supprimé avec succès',
        data: paiement
      });

    } catch (error) {
      console.error('❌ Erreur dans deletePaiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du paiement'
      });
    }
  }

  // Annuler un paiement
  static async cancelPaiement(req, res) {
    try {
      const { id } = req.params;
      const { motif } = req.body;

      if (!motif) {
        return res.status(400).json({
          success: false,
          message: 'Motif d\'annulation requis'
        });
      }

      const paiement = await Paiement.cancelPayment(parseInt(id), motif);

      if (!paiement) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Paiement annulé avec succès',
        data: paiement
      });

    } catch (error) {
      console.error('❌ Erreur dans cancelPaiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'annulation du paiement'
      });
    }
  }

  // Récupérer les statistiques générales
  static async getStats(req, res) {
    try {
      const stats = await Paiement.getStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Erreur dans getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // Route de test
  static async testPaiement(req, res) {
    try {
      res.json({
        success: true,
        message: 'API Paiements fonctionne correctement',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur dans testPaiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
}

export default PaiementController;
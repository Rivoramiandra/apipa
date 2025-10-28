// routes/paiementRoutes.js
import express from 'express';
import PaiementController from '../controllers/paiementController.js';

const router = express.Router();

// Middleware de validation
const validatePaiement = (req, res, next) => {
  const { ap_id, date_payment, method_payment, montant, payment_type, montant_total } = req.body;

  if (!ap_id || !date_payment || !method_payment || !montant || !payment_type || !montant_total) {
    return res.status(400).json({
      success: false,
      message: 'Tous les champs requis doivent être remplis'
    });
  }

  // Validation des méthodes de paiement autorisées
  const allowedMethods = ['especes', 'cheque', 'virement', 'carte'];
  if (!allowedMethods.includes(method_payment)) {
    return res.status(400).json({
      success: false,
      message: 'Méthode de paiement non valide'
    });
  }

  // Validation des types de paiement autorisés
  const allowedTypes = ['complet', 'tranche'];
  if (!allowedTypes.includes(payment_type)) {
    return res.status(400).json({
      success: false,
      message: 'Type de paiement non valide'
    });
  }

  next();
};

// Routes pour les paiements
router.post('/paiements', validatePaiement, PaiementController.createPaiement);
router.get('/paiements', PaiementController.getAllPaiements);
router.get('/paiements/ap/:ap_id', PaiementController.getPaiementsByApId);
router.get('/paiements/stats/:ap_id', PaiementController.getPaiementStats);
router.get('/paiements/:id', PaiementController.getPaiementById);
router.get('/test-paiements', PaiementController.testPaiement);

export default router;
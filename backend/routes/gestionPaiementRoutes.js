import express from 'express';
import GestionPaiementController from '../controllers/gestionPaiementController.js';

const router = express.Router();

// Routes pour les paiements
router.post('/paiements', GestionPaiementController.createPaiement);
router.get('/paiements', GestionPaiementController.getAllPaiements);
router.get('/paiements/:id', GestionPaiementController.getPaiementById);
router.get('/paiements/ap/:ap_id', GestionPaiementController.getPaiementsByApId);
router.get('/paiements/reference/:reference_payment', GestionPaiementController.getPaiementByReference);
router.put('/paiements/:id', GestionPaiementController.updatePaiement);
router.patch('/paiements/:id/statut', GestionPaiementController.updateStatut);
router.patch('/paiements/:id/montant', GestionPaiementController.updateMontant);
router.delete('/paiements/:id', GestionPaiementController.deletePaiement);

// Routes pour les statistiques et informations
router.get('/stats', GestionPaiementController.getStats);
router.get('/montant-restant/:ap_id', GestionPaiementController.getMontantRestant);

// Dans le fichier de routes - Ajouter ces routes
router.get('/stats/paiements', GestionPaiementController.getStatsPaiements);
router.get('/stats/paiements/mensuelles', GestionPaiementController.getStatsPaiementsParMois);
router.get('/stats/paiements/statut', GestionPaiementController.getStatsPaiementsParStatut);
router.get('/stats/paiements/methode', GestionPaiementController.getStatsPaiementsParMethode);

export default router;
// routes/rendezvousRoutes.js
import express from 'express';
import rendezvousController from '../controllers/rendezvousController.js';

const router = express.Router();

// ===== ROUTES DE CRÉATION =====
router.post('/from-descente/:descenteId', rendezvousController.createFromDescente);

// ===== ROUTES DE RÉCUPÉRATION =====
router.get('/', rendezvousController.getAllRendezvous);
router.get('/stats', rendezvousController.getRendezvousStats);
router.get('/statuts', rendezvousController.getAvailableStatuts);
router.get('/search/:term', rendezvousController.searchRendezvous);
router.get('/:id', rendezvousController.getRendezvousById);

// ===== ROUTES LIÉES AUX DESCENTES =====
router.get('/by-descente/:descenteId', rendezvousController.getRendezvousByDescenteId);
router.get('/check-descente/:descenteId', rendezvousController.checkDescenteHasRendezvous);

// ===== ROUTES POUR LA MISE EN DEMEURE =====
router.get('/eligible/mise-en-demeure', rendezvousController.getEligibleForMiseEnDemeure);
router.get('/:id/check-eligibility', rendezvousController.checkEligibility);
router.post('/:id/mise-en-demeure', rendezvousController.sendMiseEnDemeure);

// ===== ROUTES DE MISE À JOUR =====
router.put('/:id/statut', rendezvousController.updateStatut);
router.put('/:id', rendezvousController.updateRendezvous);

// ===== ROUTES DE SUPPRESSION =====
router.delete('/:id', rendezvousController.deleteRendezvous);

export default router;
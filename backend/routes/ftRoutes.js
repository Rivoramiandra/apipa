// routes/ftRoutes.js
import express from 'express';
import FtController from '../controllers/ftController.js';

const router = express.Router();

// ✅ ROUTES SPÉCIFIQUES EN PREMIER
router.get('/total', FtController.getTotalFT); // MAINTENANT EN HAUT

// Routes pour les statistiques
router.get('/stats', FtController.getStats);
router.get('/stats/statut', FtController.getStatsByStatus);

// Routes pour les F.T.
router.post('/', FtController.createFT);
router.get('/', FtController.getAllFT);

// Routes paramétrées - APRÈS les routes spécifiques
router.get('/:id', FtController.getFTById);
router.get('/rendezvous/:rendezvousId', FtController.getFTByRendezvousId);
router.patch('/:id/status', FtController.updateFTStatus);

// Nouvelles routes pour la gestion fine des dossiers manquants
router.patch('/:id/missing-dossiers', FtController.updateMissingDossiers);
router.post('/:id/missing-dossiers', FtController.addMissingDossier);
router.post('/:id/mark-dossier-provided', FtController.markDossierAsProvided);
router.post('/:id/mark-multiple-dossiers-provided', FtController.markMultipleDossiersAsProvided);
router.post('/:id/remove-missing-dossier', FtController.removeMissingDossier);
router.delete('/:id/missing-dossiers', FtController.clearMissingDossiers);

// Routes d'information sur les dossiers
router.get('/:id/required-dossiers', FtController.getRequiredDossiers);
router.get('/:id/dossier-completion-status', FtController.getDossierCompletionStatus);
router.post('/:id/sync-descente-dossiers', FtController.syncWithDescenteDossiers);

// Migration
router.post('/migrate-dossiers', FtController.migrateAndSyncDossiers);

// Suppression
router.delete('/:id', FtController.deleteFT);
router.get('/stats/mois-statut', FtController.getStatsByMonthAndStatus);

export default router;
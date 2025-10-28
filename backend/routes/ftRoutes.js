// routes/ftRoutes.js
import express from 'express';
import FtController from '../controllers/ftController.js';

const router = express.Router();

// Routes pour les statistiques
router.get('/stats', FtController.getStats);

// Routes pour les F.T.
router.post('/', FtController.createFT);        // POST /api/ft
router.get('/', FtController.getAllFT);         // GET /api/ft

// Routes paramétrées
router.get('/:id', FtController.getFTById);                    // GET /api/ft/:id
router.get('/rendezvous/:rendezvousId', FtController.getFTByRendezvousId); // GET /api/ft/rendezvous/:rendezvousId
router.patch('/:id/status', FtController.updateFTStatus);      // PATCH /api/ft/:id/status

// Nouvelles routes pour la gestion des dossiers manquants
router.patch('/:id/missing-dossiers', FtController.updateMissingDossiers);
router.post('/:id/missing-dossiers', FtController.addMissingDossier);
router.delete('/:id/missing-dossiers/:dossier', FtController.removeMissingDossier);
router.delete('/:id/missing-dossiers', FtController.clearMissingDossiers);

router.delete('/:id', FtController.deleteFT);  // DELETE /api/ft/:id

export default router;
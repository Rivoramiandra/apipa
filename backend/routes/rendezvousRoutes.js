// routes/rendezvousRoutes.js
import express from 'express';
import rendezvousController from '../controllers/rendezvousController.js';

const router = express.Router();

// Routes de récupération
router.get('/', rendezvousController.getAllRendezvous);
router.get('/stats', rendezvousController.getRendezvousStats);
router.get('/search/:term', rendezvousController.searchRendezvous);
router.get('/:id', rendezvousController.getRendezvousById);

// Route de mise à jour du statut
router.put('/:id/statut', rendezvousController.updateStatut);

export default router;
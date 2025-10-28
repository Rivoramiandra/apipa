import express from 'express';
import AvisDePaiementController from '../controllers/AvisDePaiementController.js';

const router = express.Router();

// Routes pour les statistiques
router.get('/stats', AvisDePaiementController.getStats);

// Routes principales pour les avis de paiement
router.post('/', AvisDePaiementController.createAP);        // POST /api/avis-de-paiement
router.get('/', AvisDePaiementController.getAllAP);         // GET /api/avis-de-paiement

// Routes paramétrées
router.get('/:id', AvisDePaiementController.getAPById);                    // GET /api/avis-de-paiement/:id
router.get('/reference/:ref_ap', AvisDePaiementController.getAPByReference); // GET /api/avis-de-paiement/reference/:ref_ap
router.put('/:id', AvisDePaiementController.updateAP);                     // PUT /api/avis-de-paiement/:id
router.patch('/:id/status', AvisDePaiementController.updateAPStatus);      // PATCH /api/avis-de-paiement/:id/status
router.patch('/:id/montant-recouvri', AvisDePaiementController.updateMontantRecouvri); // PATCH /api/avis-de-paiement/:id/montant-recouvri
router.delete('/:id', AvisDePaiementController.deleteAP);                  // DELETE /api/avis-de-paiement/:id

export default router;
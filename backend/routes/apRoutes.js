import express from 'express';
import ApController from '../controllers/ApController.js';

const router = express.Router();

// Routes existantes
router.get('/', ApController.getAllAP);
router.get('/ft-sans-ap', ApController.getFTWithoutAP);
router.get('/ft/:id', ApController.getFTById);
router.get('/ft/reference/:reference', ApController.getFTByReference);

// ✅ NOUVELLE ROUTE : Récupérer AP par FT ID
router.get('/ft/:ftId/ap', ApController.getAPByFTId);

// ✅ NOUVELLE ROUTE : UPDATE AP existant
router.put('/ft/:ftId/ap', ApController.updateAPFromFT);

// ✅ NOUVELLE ROUTE : Mise à jour du statut AP
router.put('/:id/statut', ApController.updateAPStatut);

// ✅ NOUVELLES ROUTES : Gestion des paiements en retard
router.get('/overdue/list', ApController.getOverdueAPs);
router.post('/overdue/check', ApController.checkAndUpdateOverdueAPs);
router.post('/overdue/force-check', ApController.forceCheckOverdueAPs);
router.get('/:id/check-status', ApController.checkAPStatus);
router.put('/:id/statut-with-motif', ApController.updateAPStatutWithMotif);

// ✅ CORRECTION : Route pour mise en demeure avec :id
router.put('/:id/mise-en-demeure-non-paiement', ApController.sendMiseEnDemeure);

// Routes pour gestion directe des AP
router.post('/', ApController.createAP);
router.get('/:id', ApController.getAPById);
router.put('/:id', ApController.updateAP);
router.delete('/:id', ApController.deleteAP);
router.get('/search/ap', ApController.searchAP);

export default router;
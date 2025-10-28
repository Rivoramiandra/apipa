import express from 'express';
import FaireAPController from '../controllers/faireapController.js';

const router = express.Router();

// GET /api/faireap - Récupérer tous les AP
router.get('/', FaireAPController.getAllAP);

// POST /api/faireap - Créer un nouvel AP
router.post('/', FaireAPController.createAP);

export default router;
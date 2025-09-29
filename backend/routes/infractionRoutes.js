import express from 'express';
import { 
  getInfractionsParCategorie, 
  getStatistiquesInfractions, 
  getDetailsCategorie 
} from '../controllers/infractionController.js';

const router = express.Router();

// GET /api/infractions/categories
router.get('/categories', getInfractionsParCategorie);

// GET /api/infractions/statistiques
router.get('/statistiques', getStatistiquesInfractions);

// GET /api/infractions/categories/:categorie/details
router.get('/categories/:categorie/details', getDetailsCategorie);

export default router;
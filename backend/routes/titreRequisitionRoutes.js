import express from 'express';
import { getAllTitreRequisition } from '../controllers/titreRequisitionController.js';

const router = express.Router();

router.get('/', getAllTitreRequisition);

export default router;  // maintenant c'est un default export

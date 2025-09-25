// routes/prescriptionRoute.js
import express from 'express';
import { getAllPrescriptions } from '../controllers/prescriptionController.js';

const router = express.Router();

// Route pour récupérer toutes les prescriptions
router.get('/', getAllPrescriptions);

export default router;

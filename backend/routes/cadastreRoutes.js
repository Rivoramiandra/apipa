// routes/cadastreRoutes.js
import express from 'express';
import { getAllCadastre } from '../controllers/cadastreController.js';

const router = express.Router();

// GET /api/cadastre
router.get('/', getAllCadastre);

export default router;

import express from 'express';
import { getAllDemandeFn } from '../controllers/demandeFnController.js';

const router = express.Router();

router.get('/', getAllDemandeFn);

export default router;

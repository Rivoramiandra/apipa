import express from 'express';
import { getShapefile } from '../controllers/ShapefileController.js';

const router = express.Router();

router.get('/limites', getShapefile);

export default router;

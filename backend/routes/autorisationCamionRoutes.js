import express from 'express';
import * as Controller from '../controllers/autorisationCamionController.js';

const router = express.Router();

router.get('/', Controller.getAll);
router.get('/:id', Controller.getById);
router.post('/', Controller.create);
router.put('/:id', Controller.update);
router.delete('/:id', Controller.remove);
router.patch('/:id', Controller.patchStatus);

export default router;

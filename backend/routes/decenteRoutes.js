import express from "express";
import { getAllDescente } from "../controllers/decenteController.js";

const router = express.Router();

router.get("/", getAllDescente);

export default router;
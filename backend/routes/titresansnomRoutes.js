import express from "express";
import { fetchTitresSansNom } from "../controllers/titresansnomController.js";

const router = express.Router();

router.get("/", fetchTitresSansNom);

export default router;

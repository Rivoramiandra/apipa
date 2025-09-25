import express from "express";
import cors from "cors";
import "dotenv/config";
import "./config/db.js";

import terrainRoutes from "./routes/TerrainRoutes.js";
import remblaiRoutes from "./routes/remblaiRoute.js";
import terrainNewRoutes from "./routes/TerrainNewRoute.js";
import shapefileRoutes from './routes/shapefileRoutes.js';
import cadastreRoutes from './routes/cadastreRoutes.js';
import titreRequisitionRoutes from './routes/titreRequisitionRoutes.js';
import demandeFnRoutes from './routes/demandeFnRoutes.js';
import titresansnomRoutes from "./routes/titresansnomRoutes.js";
import truckRoutes from "./routes/autorisationCamionRoutes.js";
import prescriptionRoute from './routes/prescriptionRoute.js';
import decenteRoutes from './routes/decenteRoutes.js'; 

const app = express();
const PORT = 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api", terrainRoutes);
app.use("/api", remblaiRoutes);
app.use("/api/terrain", terrainNewRoutes);
app.use('/api/shapefiles', shapefileRoutes);
app.use('/api/cadastre', cadastreRoutes);
app.use('/api/titrerequisition', titreRequisitionRoutes);
app.use('/api/demandefn', demandeFnRoutes);
app.use("/api/titresansnom", titresansnomRoutes);
app.use('/api/autorisationcamion', truckRoutes);
app.use('/api/prescriptions', prescriptionRoute);
app.use('/api/descentes', decenteRoutes); 

// Simple home page
app.get("/", (req, res) => {
  res.send("✅ Serveur Express fonctionne !");
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
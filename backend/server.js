import express from "express";
import cors from "cors";
import "dotenv/config";
import "./config/db.js";

// Routes
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
import infractionRoutes from './routes/infractionRoutes.js'; 
import demandePCRoutes from './routes/demandePCRoutes.js';
import statsituationRoutes from "./routes/statsituationRoutes.js";
import statcommuneRoutes from "./routes/statcommuneRoutes.js"; 
import statDescentesRoutes from './routes/statDescentesRoute.js'; 
import nouvelleDescenteRoutes from "./routes/nouvelleDescenteRoutes.js";
import rendezvousRoutes from './routes/rendezvousRoutes.js'; // ✅ Ajouter .js

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// --- ROUTES ---
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
app.use('/api/nouvelle-descente', nouvelleDescenteRoutes);
app.use('/api/infractions', infractionRoutes); 
app.use('/api/demandepc', demandePCRoutes);
app.use("/api", statsituationRoutes);
app.use("/api", statcommuneRoutes);
app.use('/api/stat-descentes', statDescentesRoutes);
app.use('/api/rendezvous', rendezvousRoutes); // ✅ Route rendez-vous

// Simple home page
app.get("/", (req, res) => {
  res.send("✅ Serveur Express fonctionne !");
});

// Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, req.body);
  next();
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
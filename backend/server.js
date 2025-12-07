import express from "express";
import cors from "cors";
import "dotenv/config";
import "./config/db.js";

// Routes
// import terrainRoutes from "./routes/TerrainRoutes.js";
// import remblaiRoutes from "./routes/remblaiRoute.js";
// import terrainNewRoutes from "./routes/TerrainNewRoute.js";
// import shapefileRoutes from './routes/shapefileRoutes.js';
// import cadastreRoutes from './routes/cadastreRoutes.js';
// import titreRequisitionRoutes from './routes/titreRequisitionRoutes.js';
// import demandeFnRoutes from './routes/demandeFnRoutes.js';
// import titresansnomRoutes from "./routes/titresansnomRoutes.js";
// import truckRoutes from "./routes/autorisationCamionRoutes.js";
// import prescriptionRoute from './routes/prescriptionRoute.js';
// import decenteRoutes from './routes/decenteRoutes.js'; 
// import infractionRoutes from './routes/infractionRoutes.js'; 
// import demandePCRoutes from './routes/demandePCRoutes.js';
// import statsituationRoutes from "./routes/statsituationRoutes.js";
// import statcommuneRoutes from "./routes/statcommuneRoutes.js"; 
// import statDescentesRoutes from './routes/statDescentesRoute.js'; 
import nouvelleDescenteRoutes from "./routes/nouvelleDescenteRoutes.js";
import rendezvousRoutes from './routes/rendezvousRoutes.js';
import ftRoutes from './routes/ftRoutes.js'; 
import faireapRoutes from './routes/faireapRoutes.js';
import apRoutes from './routes/apRoutes.js';
import paiementRoutes from "./routes/paiementRoutes.js";
import ApScheduler from './schedulers/apScheduler.js';
import gestionPaiementRoutes from './routes/gestionPaiementRoutes.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  next();
});

// --- ROUTES ACTIVES ---
app.use("/api/nouvelle-descente", nouvelleDescenteRoutes);
app.use('/api/rendezvous', rendezvousRoutes);

// --- ROUTES COMMENTÉES (INUTILES POUR LE MOMENT) ---
// app.use("/api", terrainRoutes);
// app.use("/api", remblaiRoutes);
// app.use("/api/terrain", terrainNewRoutes);
// app.use('/api/shapefiles', shapefileRoutes);
// app.use('/api/cadastre', cadastreRoutes);
// app.use('/api/titrerequisition', titreRequisitionRoutes);
// app.use('/api/demandefn', demandeFnRoutes);
// app.use("/api/titresansnom", titresansnomRoutes);
// app.use('/api/autorisationcamion', truckRoutes);
// app.use('/api/prescriptions', prescriptionRoute);
// app.use('/api/descentes', decenteRoutes);
// app.use('/api/infractions', infractionRoutes); 
// app.use('/api/demandepc', demandePCRoutes);
// app.use("/api", statsituationRoutes);
// app.use("/api", statcommuneRoutes);
// app.use('/api/stat-descentes', statDescentesRoutes);
app.use('/api/faireap', faireapRoutes);
app.use('/api/ft', ftRoutes);
app.use('/api', apRoutes);
app.use('/api', paiementRoutes);
app.use('/api/aps', apRoutes);
app.use('/api/gestion-paiement', gestionPaiementRoutes);

// Simple home page
app.get("/", (req, res) => {
  res.send("✅ Serveur Express fonctionne !");
});

// Route de test pour vérifier que FT fonctionne
app.get("/api/test-ft", (req, res) => {
  res.json({ 
    success: true,
    message: "Route FT test fonctionne",
    timestamp: new Date().toISOString()
  });
});

// Route de test pour vérifier que Rendezvous fonctionne
app.get("/api/test-rendezvous", (req, res) => {
  res.json({ 
    success: true,
    message: "Route Rendezvous test fonctionne",
    timestamp: new Date().toISOString(),
    endpoints: [
      "GET /api/rendezvous",
      "GET /api/rendezvous/stats", 
      "GET /api/rendezvous/statuts",
      "GET /api/rendezvous/search/:term",
      "GET /api/rendezvous/:id",
      "GET /api/rendezvous/by-descente/:descenteId",
      "GET /api/rendezvous/check-descente/:descenteId",
      "GET /api/rendezvous/eligible/mise-en-demeure",
      "GET /api/rendezvous/:id/check-eligibility",
      "POST /api/rendezvous/from-descente/:descenteId",
      "POST /api/rendezvous/:id/mise-en-demeure",
      "PUT /api/rendezvous/:id/statut",
      "PUT /api/rendezvous/:id",
      "DELETE /api/rendezvous/:id"
    ]
  });
});

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('💥 Erreur serveur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📍 Routes actives:`);
  console.log(`   - /api/nouvelle-descente/*`);
  console.log(`   - /api/rendezvous/*`);
  console.log(`📍 Testez les routes rendez-vous: http://localhost:${PORT}/api/test-rendezvous`);
  // ApScheduler.init(); // Commenté car inutile pour le moment
});
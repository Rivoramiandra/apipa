import express from "express";
import NouvelleDescenteController from "../controllers/nouvelleDescenteController.js";

const router = express.Router();

// ======================================
// ROUTES STANDARD POUR LA GESTION DES DESCENTES
// ======================================

// ✅ Créer une nouvelle descente
router.post("/descentes", (req, res) => {
  console.log("🔔 Route POST /descentes appelée !");
  console.log("Body reçu :", req.body);
  NouvelleDescenteController.create(req, res);
});

// ✅ Récupérer toutes les descentes
router.get("/descentes", (req, res) => {
  console.log("🔔 Route GET /descentes appelée !");
  NouvelleDescenteController.getAll(req, res);
});

// ✅ Récupérer une descente par ID
router.get("/descentes/:id", (req, res) => {
  console.log("🔔 Route GET /descentes/:id appelée !");
  NouvelleDescenteController.getById(req, res);
});

// ✅ Mettre à jour une descente
router.put("/descentes/:id", (req, res) => {
  console.log("🔔 Route PUT /descentes/:id appelée !");
  NouvelleDescenteController.update(req, res);
});

// ✅ Supprimer une descente
router.delete("/descentes/:id", (req, res) => {
  console.log("🔔 Route DELETE /descentes/:id appelée !");
  NouvelleDescenteController.delete(req, res);
});

// ======================================
// ROUTES POUR LA CARTE GÉOSPATIALE
// ======================================

// ✅ Récupérer toutes les descentes formatées pour la carte
router.get("/carte/descentes", (req, res) => {
  console.log("🗺️ Route GET /carte/descentes appelée !");
  NouvelleDescenteController.getAllForMap(req, res);
});

// ✅ Récupérer les détails complets d'une descente pour la carte
router.get("/carte/descentes/:id", (req, res) => {
  console.log("📋 Route GET /carte/descentes/:id appelée !");
  NouvelleDescenteController.getCompleteById(req, res);
});

// ✅ Récupérer les statistiques pour le dashboard de la carte
router.get("/carte/statistiques", (req, res) => {
  console.log("📊 Route GET /carte/statistiques appelée !");
  NouvelleDescenteController.getStats(req, res);
});

// ======================================
// ROUTES POUR LA GÉOLOCALISATION ET AUTO-COMPLÉTION
// ======================================

// ✅ Recherche de fokontany
router.get("/recherche/fokontany", (req, res) => {
  console.log("🔍 Route GET /recherche/fokontany appelée !");
  NouvelleDescenteController.searchFokontany(req, res);
});

// ✅ Récupérer les fokontany par commune
router.get("/geolocalisation/communes/:commune/fokontany", (req, res) => {
  console.log("🏘️ Route GET /geolocalisation/communes/:commune/fokontany appelée !");
  NouvelleDescenteController.getFokontanyByCommune(req, res);
});

// ✅ Récupérer les communes par district
router.get("/geolocalisation/districts/:district/communes", (req, res) => {
  console.log("🗺️ Route GET /geolocalisation/districts/:district/communes appelée !");
  NouvelleDescenteController.getCommunesByDistrict(req, res);
});

// ✅ Auto-complétion pour les formulaires
router.get("/autocomplete/form", (req, res) => {
  console.log("🤖 Route GET /autocomplete/form appelée !");
  NouvelleDescenteController.autoCompleteForm(req, res);
});

// ✅ Récupérer tous les districts
router.get("/geolocalisation/districts", (req, res) => {
  console.log("🌍 Route GET /geolocalisation/districts appelée !");
  NouvelleDescenteController.getAllDistricts(req, res);
});

// ✅ Récupérer toutes les communes
router.get("/geolocalisation/communes", (req, res) => {
  console.log("🏘️ Route GET /geolocalisation/communes appelée !");
  NouvelleDescenteController.getAllCommunes(req, res);
});
// Dans votre fichier de routes
router.get('/statistiques/mensuelles', NouvelleDescenteController.getDescentesParMois);
router.get('/statistiques/annees', NouvelleDescenteController.getAnneesDisponibles);
router.get('/statistiques/globales', NouvelleDescenteController.getStatistiquesGlobales);
// Dans votre fichier de routes
router.get('/statistiques/etapes', NouvelleDescenteController.getStatistiquesParEtape);
router.get('/statistiques/etapes/avec-pourcentages', NouvelleDescenteController.getStatistiquesParEtapeAvecPourcentages);
router.get('/statistiques/etapes/mensuelles', NouvelleDescenteController.getStatistiquesParEtapeParMois);

export default router;
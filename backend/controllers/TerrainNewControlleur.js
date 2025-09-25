// backend/controllers/TerrainNewControlleur.js
import TerrainNewModel from "../models/TerrainNewModel.js"; // attention au .js

export const createTerrain = async (req, res) => {
  try {
    const terrain = await TerrainNewModel.insertTerrain(req.body); 
    res.status(201).json({ success: true, data: terrain });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// 🔥 Nouveau contrôleur pour récupérer tous les terrains
export const getAllTerrains = async (req, res) => {
  try {
    const terrains = await TerrainNewModel.getAllTerrains();
    res.status(200).json({ success: true, data: terrains });
    console.error(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

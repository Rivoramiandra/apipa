import TerrainModel from "../models/TerrainModel.js";

class TerrainController {
  static async getTerrains(req, res) {
    try {
      const terrains = await TerrainModel.getAllTerrains();
      res.json(terrains);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default TerrainController;

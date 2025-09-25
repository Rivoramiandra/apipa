// models/TerrainModel.js
import pool from "../config/db.js";

class TerrainModel {
  static async getAllTerrains() {
    const result = await pool.query(`
      SELECT
  "PROPRIETAIRE",
  "COMMUNE",
  "FOKONTANY",
  "LOCALISATION",
  "IDENTIFICATION_DU_TERRAIN_parcelle_cadastrale_Titre",
  "X_coord",
  "y_coord",
  "SUPERFICIE_TERRAIN_m",
  "INFRACTIONS_CONSTATEES",
  ST_X(ST_PointOnSurface(geom)) AS lng,  -- Extracts X from a point on the surface
  ST_Y(ST_PointOnSurface(geom)) AS lat   -- Extracts Y from a point on the surface
FROM terrains_geom;
    `);

    return result.rows;
  }
}

export default TerrainModel;

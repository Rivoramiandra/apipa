import pool from "../config/db.js";

class DescenteModel {
  async getAllAsGeoJSON() {
    try {
      const query = `
       SELECT * FROM public.depuisavril

      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Erreur dans DescenteModel.getAllAsGeoJSON:', error);
      throw new Error("Impossible de récupérer les données de descente.");
    }
  }
}

export default new DescenteModel();
import pool from "../config/db.js";

class DescenteModel {
  async getAllAsGeoJSON() {
    try {
      const query = `
        SELECT 
          date_desce,
          actions,
          actions_su,
          commune,
          localisati AS localite,
          identifica,
          x_coord,
          y_coord,
          superficie,
          infraction
        FROM public.depuisavril
        ORDER BY date_desce DESC;
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
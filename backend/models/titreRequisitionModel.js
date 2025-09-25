import pool from '../config/db.js';

const TitreRequisition = {
  getAll: async () => {
    try {
      const result = await pool.query(`
        SELECT 
          gid, titre, properiete, sur_plan, titre_r, partie, feuille, parcelle, aire_calcu, tolerance, 
          ST_AsGeoJSON(geom) as geom
        FROM titrerequisition
        
      `);
      return result.rows;
    } catch (err) {
      console.error("Erreur getAll TitreRequisition:", err);
      throw err;
    }
  },
};

export default TitreRequisition;

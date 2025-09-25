import pool from '../config/db.js'; // Connexion PostgreSQL

const DemandeFn = {
  getAll: async () => {
    try {
      const result = await pool.query(`
        SELECT 
          gid, shape_leng, n_fn_fg, demandeur, sur_plan, localite, fokontany, situation, aire_cal,
          ST_AsGeoJSON(geom) as geom
        FROM demandefn
        ORDER BY gid DESC
      `);
      return result.rows;
    } catch (err) {
      console.error("Erreur getAll demande_fn:", err);
      throw err;
    }
  },
};

// ✅ ICI on utilise ESM et pas module.exports
export default DemandeFn;

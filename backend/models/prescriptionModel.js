// models/prescriptionModel.js
import pool from '../config/db.js';

const Prescription = {
  getAll: async () => {
    try {
      const result = await pool.query(`
        SELECT gid, objectid, id, category, orig_fid, area, f_category, shape_leng, shape_area, 
               ST_AsGeoJSON(geom) as geom
        FROM precscriptiontbl
      `);
      return result.rows;
    } catch (err) {
      console.error("Erreur SQL prescriptiontbl:", err);
      throw err;
    }
  },
};

export default Prescription;

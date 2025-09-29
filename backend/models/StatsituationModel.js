// models/StatsituationModel.js
import pool from "../config/db.js";

class StatsituationModel {
  static async getStatsituations() {
    const query = `
      SELECT * FROM (
          SELECT 
              CASE 
                  WHEN "situation" IS NULL OR TRIM("situation") = '' THEN '(vide)'
                  ELSE "situation"
              END AS statisituation,
              COUNT(*) AS nombre
          FROM depuisavril
          GROUP BY 
              CASE 
                  WHEN "situation" IS NULL OR TRIM("situation") = '' THEN '(vide)'
                  ELSE "situation"
              END
      ) t
      UNION ALL
      SELECT 'Total général' AS statisituation, COUNT(*) AS nombre FROM depuisavril;
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default StatsituationModel;

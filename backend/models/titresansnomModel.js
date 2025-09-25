import pool from "../config/db.js";

export const getAllTitresSansNom = async () => {
  const query = `
    SELECT gid, objectid, titre, propriete, sur_plan, titre_r, partie, feuille, parcelle,
           ST_AsGeoJSON(geom) AS geom
    FROM titresansnom;
  `;
  const result = await pool.query(query);
  return result.rows.map(row => ({
    type: "Feature",
    geometry: JSON.parse(row.geom),
    properties: {
      gid: row.gid,
      objectid: row.objectid,
      titre: row.titre,
      propriete: row.propriete,
      sur_plan: row.sur_plan,
      titre_r: row.titre_r,
      partie: row.partie,
      feuille: row.feuille,
      parcelle: row.parcelle,
    },
  }));
};

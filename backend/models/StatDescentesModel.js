import pool from "../config/db.js";

class StatDescentesModel {

    static async getDossiersParMois(annee = null) {
        let whereClause = '';
        if (annee) {
            whereClause = `WHERE EXTRACT(YEAR FROM "date_desce") = ${annee}`;
        }

        const query = `
            SELECT DATE_TRUNC('month', "date_desce") AS mois,
                   COUNT(*) AS nombre_dossiers
            FROM depuisavril
            ${whereClause}
            GROUP BY DATE_TRUNC('month', "date_desce")
            ORDER BY mois ASC;
        `;

        const result = await pool.query(query);
        return result.rows;
    }
}

export default StatDescentesModel;

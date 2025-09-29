import pool from "../config/db.js";

class StatCommuneModel {

    static async getStatCommunes() {
        const query = `
            SELECT * FROM (
                SELECT 
                    CASE 
                        -- Gérer les valeurs NULL ou vides pour la colonne de la commune
                        WHEN "commune" IS NULL OR TRIM("commune") = '' THEN '(vide)'
                        ELSE "commune"
                    END AS nom_commune,
                    COUNT(*) AS nombre
                FROM 
                    depuisavril
                GROUP BY 
                    CASE 
                        WHEN "commune" IS NULL OR TRIM("commune") = '' THEN '(vide)'
                        ELSE "commune"
                    END
            ) t
            UNION ALL
            -- Ajouter la ligne du Total général
            SELECT 
                'Total général' AS nom_commune, 
                COUNT(*) AS nombre 
            FROM 
                depuisavril;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default StatCommuneModel;
import pool from '../config/db.js';

const Infraction = {
  getNombreInfractionsParCategorie: async () => {
    try {
      const result = await pool.query(`
        SELECT
          CASE
            WHEN LOWER(TRIM(infraction)) IN ('remblai illicite', 'remblai illcite', 'remblai illicite') THEN 'Remblai Illicite (Total)'
            WHEN LOWER(TRIM(infraction)) IN (
              'construction sur remblai illicite',
              'constructiion sur remblai illicite',
              'construction sur remblai illicite et destruction du digue publique',
              'construction sur remblai',
              'construction sur remblai illicite',
              'construction sur rembali illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite'
            ) THEN 'Construction sur Remblai Illicite (Total)'
            WHEN LOWER(TRIM(infraction)) LIKE '%digue%'
              OR LOWER(TRIM(infraction)) LIKE '%canal%'
              OR LOWER(TRIM(infraction)) LIKE '%emprise publique%'
              OR LOWER(TRIM(infraction)) LIKE '%by-pass%'
              OR LOWER(TRIM(infraction)) LIKE '%siphon d''équilibre%'
              OR LOWER(TRIM(infraction)) LIKE '%lit majeur%'
            THEN 'Construction/Occupation sur Domaines Publics (Digue/Canal/Emprise)'
            ELSE 'Autres Infractions (Vérification, Contrôle, Isolées)'
          END AS categorie_consolidee,
          COUNT(*) AS nombre_de_terrains
        FROM
          depuisavril
        GROUP BY
          categorie_consolidee
        ORDER BY
          nombre_de_terrains DESC;
      `);
      return result.rows;
    } catch (err) {
      console.error("Erreur SQL infractions:", err);
      throw err;
    }
  },

  getNombreInfractionsAvecFiltres: async (filters = {}) => {
    try {
      let whereClause = '';
      const queryParams = [];
      let paramCount = 0;

      if (filters.dateDebut && filters.dateFin) {
        whereClause = ` WHERE date_infraction BETWEEN $${++paramCount} AND $${++paramCount}`;
        queryParams.push(filters.dateDebut, filters.dateFin);
      }

      if (filters.commune) {
        whereClause += whereClause ? ' AND' : ' WHERE';
        whereClause += ` LOWER(TRIM(commune)) = LOWER(TRIM($${++paramCount}))`;
        queryParams.push(filters.commune);
      }

      const query = `
        SELECT
          CASE
            WHEN LOWER(TRIM(infraction)) IN ('remblai illicite', 'remblai illcite', 'remblai illicite') THEN 'Remblai Illicite (Total)'
            WHEN LOWER(TRIM(infraction)) IN (
              'construction sur remblai illicite',
              'constructiion sur remblai illicite',
              'construction sur remblai illicite et destruction du digue publique',
              'construction sur remblai',
              'construction sur remblai illicite',
              'construction sur rembali illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite',
              'construction sur remblai illicite'
            ) THEN 'Construction sur Remblai Illicite (Total)'
            WHEN LOWER(TRIM(infraction)) LIKE '%digue%'
              OR LOWER(TRIM(infraction)) LIKE '%canal%'
              OR LOWER(TRIM(infraction)) LIKE '%emprise publique%'
              OR LOWER(TRIM(infraction)) LIKE '%by-pass%'
              OR LOWER(TRIM(infraction)) LIKE '%siphon d''équilibre%'
              OR LOWER(TRIM(infraction)) LIKE '%lit majeur%'
            THEN 'Construction/Occupation sur Domaines Publics (Digue/Canal/Emprise)'
            ELSE 'Autres Infractions (Vérification, Contrôle, Isolées)'
          END AS categorie_consolidee,
          COUNT(*) AS nombre_de_terrains
        FROM
          depuisavril
        ${whereClause}
        GROUP BY
          categorie_consolidee
        ORDER BY
          nombre_de_terrains DESC;
      `;

      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (err) {
      console.error("Erreur SQL infractions filtrées:", err);
      throw err;
    }
  },

  getDetailsParCategorie: async (categorie) => {
    try {
      const result = await pool.query(`
        SELECT 
          infraction,
          COUNT(*) as count,
          COUNT(*) * 100.0 / (SELECT COUNT(*) FROM depuisavril) as percentage
        FROM depuisavril
        WHERE LOWER(TRIM(infraction)) IN (
          SELECT DISTINCT LOWER(TRIM(infraction))
          FROM depuisavril
          WHERE 
            CASE
              WHEN LOWER(TRIM(infraction)) IN ('remblai illicite', 'remblai illcite', 'remblai illicite') THEN 'Remblai Illicite (Total)'
              WHEN LOWER(TRIM(infraction)) IN (
                'construction sur remblai illicite',
                'constructiion sur remblai illicite',
                'construction sur remblai illicite et destruction du digue publique',
                'construction sur remblai',
                'construction sur remblai illicite',
                'construction sur rembali illicite',
                'construction sur remblai illicite',
                'construction sur remblai illicite',
                'construction sur remblai illicite',
                'construction sur remblai illicite',
                'construction sur remblai illicite',
                'construction sur remblai illicite',
                'construction sur remblai illicite',
                'construction sur remblai illicite'
              ) THEN 'Construction sur Remblai Illicite (Total)'
              WHEN LOWER(TRIM(infraction)) LIKE '%digue%'
                OR LOWER(TRIM(infraction)) LIKE '%canal%'
                OR LOWER(TRIM(infraction)) LIKE '%emprise publique%'
                OR LOWER(TRIM(infraction)) LIKE '%by-pass%'
                OR LOWER(TRIM(infraction)) LIKE '%siphon d''équilibre%'
                OR LOWER(TRIM(infraction)) LIKE '%lit majeur%'
              THEN 'Construction/Occupation sur Domaines Publics (Digue/Canal/Emprise)'
              ELSE 'Autres Infractions (Vérification, Contrôle, Isolées)'
            END = $1
        )
        GROUP BY infraction
        ORDER BY count DESC;
      `, [categorie]);

      return result.rows;
    } catch (err) {
      console.error("Erreur SQL détails catégorie:", err);
      throw err;
    }
  }
};

export default Infraction;
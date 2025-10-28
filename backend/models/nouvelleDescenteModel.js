import pool from "../config/db.js";

class NouvelleDescente {
  static async create(nouvelleDescenteData) {
    const {
      date_desce,
      heure_descente,
      date_rendez_vous,
      heure_rendez_vous,
      n_pv_pat,
      n_fifafi,
      type_verbalisateur,
      nom_verbalisateur,
      personne_r,
      nom_personne_r,
      commune,
      fokontany,
      localisation,
      x_coord,
      y_coord,
      x_long,
      y_lat,
      infraction,
      actions,
      proprietaire,
      modele_pv,
      reference,
      contact_r,
      adresse_r,
      dossier_a_fournir
    } = nouvelleDescenteData;

    const query = `
      INSERT INTO depuisavril (
        date_desce, heure_descente, date_rendez_vous, heure_rendez_vous,
        n_pv_pat, n_fifafi, type_verbalisateur, nom_verbalisateur, 
        personne_r, nom_personne_r, commune, fokontany, localisati, 
        x_coord, y_coord, x_long, y_lat, infraction, actions, 
        proprietai, modele_pv, reference, created_at,
        actions_su, superficie, destinatio, montant, suite_a_do, 
        amende_reg, n_pv_api, pieces_fou, recommanda, "Montant _1", 
        "Montant _2", observatio, situation, situatio_1,
        contact_r, adresse_r, dossier_a_fournir
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(),
        '', 0, '', '0', '', '0', '', '', '', '0', '0', '', 'en_cours', 'en_attente',
        $23, $24, $25
      )
      RETURNING *
    `;

    const values = [
      date_desce, heure_descente, date_rendez_vous || null, heure_rendez_vous || null,
      n_pv_pat, n_fifafi, type_verbalisateur, nom_verbalisateur,
      personne_r, nom_personne_r, commune, fokontany, localisation,
      x_coord || null, y_coord || null, x_long || null, y_lat || null,
      infraction, actions, proprietaire, modele_pv, reference || null,
      contact_r || null, adresse_r || null, dossier_a_fournir || []
    ];

    try {
      console.log("📊 Exécution de la requête SQL avec valeurs:", values);
      const result = await pool.query(query, values);
      console.log("✅ Insertion réussie:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("❌ Erreur SQL détaillée:", error);
      throw new Error(`Erreur lors de la création de la nouvelle descente: ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const query = `SELECT * FROM depuisavril ORDER BY created_at DESC`;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des descentes: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const query = `SELECT * FROM depuisavril WHERE n = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de la descente: ${error.message}`);
    }
  }
}

export default NouvelleDescente;
import pool from "../config/db.js";

class NouvelleDescente {
  static async create(nouvelleDescenteData) {
    const {
      date_desce, // ✅ Correction: correspond à date_desce dans la table
      heure_descente,
      date_rendez_vous,
      heure_rendez_vous,
      n_pv_pat,    // ✅ Correction: utilise n_pv_pat au lieu de numero_pv
      n_fifafi,    // ✅ Correction: utilise n_fifafi selon le modèle
      type_verbalisateur,
      nom_verbalisateur,
      personne_r,
      nom_personne_r,
      commune,
      fokontany,
      localisation, // ✅ Correction: correspond à localisati dans la table
      x_coord,
      y_coord,
      x_long,       // ✅ Ajout des champs manquants
      y_lat,
      infraction,
      actions,
      proprietaire, // ✅ Ajout: mapping vers proprietai
      modele_pv
    } = nouvelleDescenteData;

    // ✅ Requête SQL corrigée avec les bons noms de colonnes
    const query = `
      INSERT INTO depuisavril (
        date_desce, heure_descente, date_rendez_vous, heure_rendez_vous,
        n_pv_pat, n_fifafi, type_verbalisateur, nom_verbalisateur, 
        personne_r, nom_personne_r, commune, fokontany, localisati, 
        x_coord, y_coord, x_long, y_lat, infraction, actions, 
        proprietai, modele_pv, created_at,
        -- Champs avec valeurs par défaut pour éviter les erreurs
        actions_su, superficie, destinatio, montant, suite_a_do, 
        amende_reg, n_pv_api, pieces_fou, recommanda, "Montant _1", 
        "Montant _2", referenc, observatio, situation, situatio_1
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        $14, $15, $16, $17, $18, $19, $20, $21, NOW(),
        -- Valeurs par défaut pour les champs obligatoires
        '', 0, '', '0', '', '0', '', '', '', '0', '0', '', '', 'en_cours', 'en_attente'
      )
      RETURNING *
    `;

    const values = [
      date_desce,                    // $1
      heure_descente,               // $2
      date_rendez_vous || null,     // $3
      heure_rendez_vous || null,    // $4
      modele_pv === 'PAT' ? n_pv_pat : null,  // $5: n_pv_pat
      modele_pv === 'FIFAFI' ? n_fifafi : null, // $6: n_fifafi
      type_verbalisateur,           // $7
      nom_verbalisateur,            // $8
      personne_r,                   // $9
      nom_personne_r,               // $10
      commune,                      // $11
      fokontany,                    // $12
      localisation,                 // $13: mappe vers localisati
      x_coord || null,              // $14
      y_coord || null,              // $15
      y_coord || null,              // $16: x_long (inversion potentielle)
      x_coord || null,              // $17: y_lat (inversion potentielle)
      infraction,                   // $18
      actions,                      // $19: déjà formaté en string
      proprietaire,                 // $20: proprietai dans la table
      modele_pv                     // $21
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

  // ✅ Méthode pour récupérer toutes les descentes
  static async findAll() {
    try {
      const query = `
        SELECT * FROM depuisavril 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des descentes: ${error.message}`);
    }
  }

  // ✅ Méthode pour récupérer par ID
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
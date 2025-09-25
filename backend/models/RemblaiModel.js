// models/RemblaiModel.js
import pool from "../config/db.js";

class RemblaiModel {
  // Récupérer tous les remblais
  static async getAllRemblai() {
    const query = `
      SELECT 
        n,
        date_desce,
        actions,
        n_pv_pat,
        n_fifafi,
        actions_su,
        proprietai,
        commune,
        localisati AS localite,
        identifica,
        x_coord,
        y_coord,
        x_long,
        y_lat,
        superficie,
        destinatio,
        montant,
        infraction,
        suite_a_do,
        amende_reg,
        n_pv_api,
        personne_r,
        pieces_fou,
        recommanda,
        "Montant _1",
        "Montant _2",
        referenc,
        observatio,
        situation,
        situatio_1,
        geom
      FROM public.depuisavril
      ORDER BY n ASC
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      id: row.n,
      localite: row.localite,
      commune: row.commune,
      volume: row.superficie,
      lat: row.y_coord,      // Utiliser y_coord pour la latitude
      lng: row.x_coord,      // Utiliser x_coord pour la longitude
      actions: row.actions,
      proprietaire: row.proprietai,
      destination: row.destinatio,
      montant: row.montant,
      situation: row.situation,
      // Garder les valeurs originales pour le débogage
      x_coord: row.x_coord,
      y_coord: row.y_coord,
      x_long: row.x_long,
      y_lat: row.y_lat
    }));
  }

  // Ajouter un remblai
  static async createRemblai(remblai) {
    const {
      date_desce, actions, n_pv_pat, n_fifafi, actions_su, proprietai,
      commune, localisati, identifica, x_coord, y_coord, x_long, y_lat,
      superficie, destinatio, montant, infraction, suite_a_do, amende_reg,
      n_pv_api, personne_r, pieces_fou, recommanda, montant_1, montant_2,
      referenc, observatio, situation, situatio_1, geom
    } = remblai;

    const result = await pool.query(
      `INSERT INTO public.depuisavril(
        date_desce, actions, n_pv_pat, n_fifafi, actions_su, proprietai,
        commune, localisati, identifica, x_coord, y_coord, x_long, y_lat,
        superficie, destinatio, montant, infraction, suite_a_do, amende_reg,
        n_pv_api, personne_r, pieces_fou, recommanda, "Montant _1", "Montant _2",
        referenc, observatio, situation, situatio_1, geom
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      ) RETURNING *`,
      [
        date_desce, actions, n_pv_pat, n_fifafi, actions_su, proprietai,
        commune, localisati, identifica, x_coord, y_coord, x_long, y_lat,
        superficie, destinatio, montant, infraction, suite_a_do, amende_reg,
        n_pv_api, personne_r, pieces_fou, recommanda, montant_1, montant_2,
        referenc, observatio, situation, situatio_1, geom
      ]
    );
    return result.rows[0];
  }

  // Méthode pour mettre à jour les coordonnées d'un remblai
  static async updateRemblaiCoordinates(id, x_coord, y_coord) {
    const result = await pool.query(
      `UPDATE public.depuisavril 
       SET x_coord = $1, y_coord = $2 
       WHERE n = $3 
       RETURNING *`,
      [x_coord, y_coord, id]
    );
    return result.rows[0];
  }
}

export default RemblaiModel;
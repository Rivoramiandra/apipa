// models/DemandePCModel.js
import pool from "../config/db.js";

class DemandePCModel {
  static async getAllDemandes() {
    try {
      console.log("Exécution de la requête SQL pour demandepc...");
      
      const result = await pool.query(`
        SELECT
          id,
          demandeur,
          adresse,
          localisation,
          commune,
          proprietaire,
          titre,
          immatricul,
          x_coord,
          y_coord,
          x_long,
          y_lat,
          situation,
          prescription,
          reference,
          superficie,
          superfic_1,
          avis_de_pa,
          montant_de,
          service_en,
          date_d_arr,
          date_de_co,
          avis_commi,
          observatio,
          avis_defi,
          date_defi,
          categorie,
          annee,
          ST_X(ST_PointOnSurface(geom)) AS lng,
          ST_Y(ST_PointOnSurface(geom)) AS lat
        FROM demandepc
        ORDER BY date_d_arr DESC;
      `);

      console.log("Requête exécutée avec succès, nombre de résultats:", result.rows.length);
      return result.rows;
    } catch (error) {
      console.error("Erreur SQL détaillée:", error);
      throw new Error(`Erreur de base de données: ${error.message}`);
    }
  }
}

export default DemandePCModel;
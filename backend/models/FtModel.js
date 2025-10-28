import pool from "../config/db.js";

class FtModel {
  // Créer un nouveau F.T.
  static async create(ftData) {
    try {
      const {
        rendezvous_id,
        reference_ft,
        date_ft,
        heure_ft,
        type_convoquee,
        nom_complet,
        cin,
        contact,
        adresse,
        titre_terrain,
        nomproprietaire,
        localisation,
        superficie,
        motif,
        lieu,
        but,
        mesure,
        dossier_type,
        id_descente,
        num_pv,
        commune,
        fokotany,
        localite,
        coord_x,
        coord_y,
        infraction,
        dossier,
        status_dossier = 'En cours',
        missing_dossiers = null,
        duration_complement = null,  
        deadline_complement = null
      } = ftData;

      const query = `
        INSERT INTO ft_table (
          rendezvous_id, reference_ft, date_ft, heure_ft,
          type_convoquee, nom_complet, cin, contact, adresse,
          titre_terrain, nomproprietaire, localisation, superficie,
          motif, lieu, but, mesure,
          dossier_type,
          id_descente, num_pv, commune, fokotany, localite,
          coord_x, coord_y, infraction, dossier,
          status_dossier, missing_dossiers, duration_complement, deadline_complement
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
        RETURNING *
      `;

      const values = [
        rendezvous_id,
        reference_ft,
        date_ft,
        heure_ft,
        type_convoquee,
        nom_complet,
        cin,
        contact,
        adresse,
        titre_terrain,
        nomproprietaire,
        localisation,
        superficie,
        motif,
        lieu,
        but,
        mesure,
        dossier_type,
        id_descente,
        num_pv,
        commune,
        fokotany,
        localite,
        coord_x,
        coord_y,
        infraction,
        dossier,
        status_dossier,
        missing_dossiers,
        duration_complement,
        deadline_complement
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans FtModel.create:', error);
      throw error;
    }
  }

  // Récupérer tous les F.T.
  static async findAll() {
    try {
      const query = 'SELECT * FROM ft_table ORDER BY date_ft DESC, id DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur dans FtModel.findAll:', error);
      throw error;
    }
  }

  // Récupérer un F.T. par ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM ft_table WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans FtModel.findById:', error);
      throw error;
    }
  }

  // Récupérer les F.T. par rendezvous_id
  static async findByRendezvousId(rendezvousId) {
    try {
      const query = 'SELECT * FROM ft_table WHERE rendezvous_id = $1 ORDER BY id DESC';
      const result = await pool.query(query, [rendezvousId]);
      return result.rows;
    } catch (error) {
      console.error('Erreur dans FtModel.findByRendezvousId:', error);
      throw error;
    }
  }

  // Vérifier si une référence FT existe déjà
  static async checkReferenceExists(reference_ft) {
    try {
      const query = 'SELECT id FROM ft_table WHERE reference_ft = $1';
      const result = await pool.query(query, [reference_ft]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erreur dans FtModel.checkReferenceExists:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'un F.T.
  static async updateStatus(id, status_dossier) {
    try {
      const query = 'UPDATE ft_table SET status_dossier = $1 WHERE id = $2 RETURNING *';
      const result = await pool.query(query, [status_dossier, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans FtModel.updateStatus:', error);
      throw error;
    }
  }

  // Mettre à jour les dossiers manquants avec statut automatique
  static async updateMissingDossiers(id, missing_dossiers) {
    try {
      // Déterminer le statut basé sur les dossiers manquants
      const isRegularise = !missing_dossiers || missing_dossiers.length === 0;
      const newStatus = isRegularise ? 'Traité' : 'En cours';
      
      const query = `
        UPDATE ft_table 
        SET missing_dossiers = $1,
            status_dossier = $2
        WHERE id = $3 
        RETURNING *
      `;
      const result = await pool.query(query, [missing_dossiers, newStatus, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans FtModel.updateMissingDossiers:', error);
      throw error;
    }
  }

  // Ajouter un dossier manquant
  static async addMissingDossier(id, dossier) {
    try {
      const query = `
        UPDATE ft_table 
        SET missing_dossiers = 
          CASE 
            WHEN missing_dossiers IS NULL THEN ARRAY[$1]
            ELSE array_append(missing_dossiers, $1)
          END,
        status_dossier = 'En cours'
        WHERE id = $2 
        RETURNING *
      `;
      const result = await pool.query(query, [dossier, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans FtModel.addMissingDossier:', error);
      throw error;
    }
  }

  // Vider tous les dossiers manquants
  static async clearMissingDossiers(id) {
    try {
      const query = `
        UPDATE ft_table 
        SET missing_dossiers = NULL,
            status_dossier = 'Traité'
        WHERE id = $1 
        RETURNING *
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans FtModel.clearMissingDossiers:', error);
      throw error;
    }
  }

  // Supprimer un F.T.
  static async delete(id) {
    try {
      const query = 'DELETE FROM ft_table WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans FtModel.delete:', error);
      throw error;
    }
  }
  static async getStats() {
  try {
    const allFT = await this.findAll();
    
    const total = allFT.length;
    const en_cours = allFT.filter(ft => ft.status_dossier === 'En cours').length;
    const dossiers_regularises = allFT.filter(ft => 
      !ft.missing_dossiers || ft.missing_dossiers.length === 0
    ).length;
    const dossiers_irregularises = allFT.filter(ft => 
      ft.missing_dossiers && ft.missing_dossiers.length > 0
    ).length;

    const pourcentage_regularises = total > 0 ? Math.round((dossiers_regularises / total) * 100) : 0;
    const pourcentage_irregularises = total > 0 ? Math.round((dossiers_irregularises / total) * 100) : 0;
    const pourcentage_en_cours = total > 0 ? Math.round((en_cours / total) * 100) : 0;

    return {
      total,
      en_cours,
      dossiers_regularises,
      dossiers_irregularises,
      pourcentage_regularises,
      pourcentage_irregularises,
      pourcentage_en_cours
    };
  } catch (error) {
    console.error('Erreur dans FtModel.getStats:', error);
    throw error;
  }
}


}


export default FtModel;
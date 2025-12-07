import pool from '../config/db.js';

class RendezvousModel {
  // Créer un nouveau rendez-vous à partir d'une descente
  static async createFromDescente(descenteData) {
    try {
      const {
        n, // ID de la descente
        date_rendez_vous,
        heure_rendez_vous,
        date_desce,
        heure_descente,
        type_verbalisateur,
        nom_verbalisateur,
        personne_r,
        nom_personne_r,
        contact_r,
        adresse_r,
        commune,
        fokontany,
        localisati,
        x_coord,
        y_coord,
        infraction,
        dossier_a_fournir,
        n_pv_pat,
        n_fifafi
      } = descenteData;

      const query = `
        INSERT INTO rendezvous (
          id_descente, date_rendez_vous, heure_rendez_vous, date_desce, heure_descente,
          type_verbalisateur, nom_verbalisateur, personne_r, nom_personne_r,
          contact_r, adresse_r, commune, fokontany, localite,
          coord_x, coord_y, infraction, dossier_a_fournir,
          n_pv_pat, n_fifafi, statut
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'En cours')
        RETURNING *
      `;

      const values = [
        n,
        date_rendez_vous,
        heure_rendez_vous,
        date_desce,
        heure_descente,
        type_verbalisateur,
        nom_verbalisateur,
        personne_r,
        nom_personne_r,
        contact_r,
        adresse_r,
        commune,
        fokontany,
        localisati,
        x_coord,
        y_coord,
        infraction,
        dossier_a_fournir,
        n_pv_pat,
        n_fifafi
      ];

      console.log("📅 Création du rendez-vous depuis la descente:", values);
      const result = await pool.query(query, values);
      console.log("✅ Rendez-vous créé avec succès:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur lors de la création du rendez-vous:', error);
      throw new Error(`Erreur lors de la création du rendez-vous: ${error.message}`);
    }
  }

  // Récupérer tous les rendez-vous avec les infos de la descente
  static async getAllRendezvous() {
    try {
      const query = `
        SELECT 
          r.*,
          d.reference as reference_descente,
          d.actions as actions_descente,
          d.modele_pv,
          d.statut_descente
        FROM rendezvous r
        LEFT JOIN descentes d ON r.id_descente = d.n
        ORDER BY r.date_rendez_vous DESC, r.heure_rendez_vous DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des rendez-vous:', error);
      throw new Error(`Erreur lors de la récupération des rendez-vous: ${error.message}`);
    }
  }

  // Récupérer un rendez-vous par ID avec infos complètes
  static async getRendezvousById(id) {
    try {
      const query = `
        SELECT 
          r.*,
          d.reference as reference_descente,
          d.actions as actions_descente,
          d.modele_pv,
          d.statut_descente,
          d.created_at as date_creation_descente
        FROM rendezvous r
        LEFT JOIN descentes d ON r.id_descente = d.n
        WHERE r.id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (!result.rows[0]) {
        throw new Error('Rendez-vous non trouvé');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du rendez-vous:', error);
      throw new Error(`Erreur lors de la récupération du rendez-vous: ${error.message}`);
    }
  }

  // Récupérer les rendez-vous par ID de descente
  static async getRendezvousByDescenteId(descenteId) {
    try {
      const query = `
        SELECT * FROM rendezvous 
        WHERE id_descente = $1 
        ORDER BY date_rendez_vous DESC
      `;
      const result = await pool.query(query, [descenteId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des rendez-vous par descente:', error);
      throw new Error(`Erreur lors de la récupération des rendez-vous: ${error.message}`);
    }
  }

  // Vérifier si une descente a déjà un rendez-vous
  static async checkDescenteHasRendezvous(descenteId) {
    try {
      const query = 'SELECT id FROM rendezvous WHERE id_descente = $1';
      const result = await pool.query(query, [descenteId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du rendez-vous:', error);
      throw new Error(`Erreur lors de la vérification: ${error.message}`);
    }
  }

  // Mettre à jour le statut d'un rendez-vous (avec anciens statuts)
  static async updateStatut(id, statut) {
    try {
      const query = `
        UPDATE rendezvous 
        SET statut = $1
        WHERE id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [statut, id]);
      
      if (!result.rows[0]) {
        throw new Error('Rendez-vous non trouvé');
      }
      
      console.log(`✅ Statut du rendez-vous ${id} mis à jour: ${statut}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  }

  // Mettre à jour un rendez-vous
  static async update(id, rendezvousData) {
    try {
      const {
        date_rendez_vous,
        heure_rendez_vous,
        type_verbalisateur,
        nom_verbalisateur,
        personne_r,
        nom_personne_r,
        contact_r,
        adresse_r,
        commune,
        fokontany,
        localite,
        coord_x,
        coord_y,
        infraction,
        dossier_a_fournir,
        n_pv_pat,
        n_fifafi,
        statut,
        notes
      } = rendezvousData;

      const query = `
        UPDATE rendezvous SET
          date_rendez_vous = $1,
          heure_rendez_vous = $2,
          type_verbalisateur = $3,
          nom_verbalisateur = $4,
          personne_r = $5,
          nom_personne_r = $6,
          contact_r = $7,
          adresse_r = $8,
          commune = $9,
          fokontany = $10,
          localite = $11,
          coord_x = $12,
          coord_y = $13,
          infraction = $14,
          dossier_a_fournir = $15,
          n_pv_pat = $16,
          n_fifafi = $17,
          statut = $18,
          notes = $19
        WHERE id = $20
        RETURNING *
      `;

      const values = [
        date_rendez_vous,
        heure_rendez_vous,
        type_verbalisateur,
        nom_verbalisateur,
        personne_r,
        nom_personne_r,
        contact_r,
        adresse_r,
        commune,
        fokontany,
        localite,
        coord_x,
        coord_y,
        infraction,
        dossier_a_fournir,
        n_pv_pat,
        n_fifafi,
        statut,
        notes,
        id
      ];

      console.log("📝 Mise à jour du rendez-vous:", values);
      const result = await pool.query(query, values);
      
      if (!result.rows[0]) {
        throw new Error('Rendez-vous non trouvé');
      }
      
      console.log("✅ Rendez-vous mis à jour avec succès");
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du rendez-vous:', error);
      throw new Error(`Erreur lors de la mise à jour du rendez-vous: ${error.message}`);
    }
  }

  // Rechercher des rendez-vous
  static async searchRendezvous(term) {
    try {
      const searchTerm = `%${term}%`;
      const query = `
        SELECT 
          r.*,
          d.reference as reference_descente
        FROM rendezvous r
        LEFT JOIN descentes d ON r.id_descente = d.n
        WHERE r.infraction ILIKE $1
          OR r.commune ILIKE $1
          OR r.fokontany ILIKE $1
          OR r.nom_personne_r ILIKE $1
          OR d.reference ILIKE $1
        ORDER BY r.date_rendez_vous DESC, r.heure_rendez_vous DESC
      `;
      const result = await pool.query(query, [searchTerm]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche des rendez-vous:', error);
      throw new Error(`Erreur lors de la recherche des rendez-vous: ${error.message}`);
    }
  }

  // Récupérer les statistiques des rendez-vous (avec anciens statuts)
  static async getRendezvousStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE statut = 'En cours') as encours,
          COUNT(*) FILTER (WHERE statut = 'Avec comparution') as aveccomparution,
          COUNT(*) FILTER (WHERE statut = 'Non comparution') as noncomparution
        FROM rendezvous
      `;
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  // Envoyer une mise en demeure
  static async sendMiseEnDemeure(id, nouvelleDate = null, nouvelleHeure = null) {
    try {
      const query = `
        UPDATE rendezvous 
        SET 
          statut = 'En cours',
          is_mise_en_demeure = true,
          mise_en_demeure_sent = true,
          date_rendez_vous = COALESCE($1, date_rendez_vous),
          heure_rendez_vous = COALESCE($2, heure_rendez_vous),
          date_envoi_mise_en_demeure = NOW()
        WHERE id = $3
        RETURNING *
      `;
      const result = await pool.query(query, [nouvelleDate, nouvelleHeure, id]);
      
      if (!result.rows[0]) {
        throw new Error('Rendez-vous non trouvé');
      }
      
      console.log("✅ Mise en demeure envoyée pour le rendez-vous:", id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la mise en demeure:', error);
      throw new Error(`Erreur lors de l'envoi de la mise en demeure: ${error.message}`);
    }
  }

  // Récupérer les rendez-vous éligibles pour mise en demeure
  static async getRendezvousEligibleForMiseEnDemeure() {
    try {
      const query = `
        SELECT * FROM rendezvous 
        WHERE statut = 'Non comparution' 
          AND mise_en_demeure_sent = false
          AND date_rendez_vous <= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY date_rendez_vous ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des rendez-vous éligibles:', error);
      throw new Error(`Erreur lors de la récupération des rendez-vous éligibles: ${error.message}`);
    }
  }

  // Vérifier si un rendez-vous est éligible pour mise en demeure
  static async isEligibleForMiseEnDemeure(id) {
    try {
      const query = `
        SELECT 
          *,
          (date_rendez_vous <= CURRENT_DATE - INTERVAL '7 days') as eligible
        FROM rendezvous 
        WHERE id = $1 
          AND statut = 'Non comparution' 
          AND mise_en_demeure_sent = false
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return { eligible: false, rendezvous: null };
      }
      
      return { 
        eligible: result.rows[0].eligible, 
        rendezvous: result.rows[0] 
      };
    } catch (error) {
      console.error('❌ Erreur lors de la vérification d\'éligibilité:', error);
      throw new Error(`Erreur lors de la vérification d'éligibilité: ${error.message}`);
    }
  }

  // Supprimer un rendez-vous
  static async delete(id) {
    try {
      const query = 'DELETE FROM rendezvous WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      
      if (!result.rows[0]) {
        throw new Error('Rendez-vous non trouvé');
      }
      
      console.log("✅ Rendez-vous supprimé:", id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du rendez-vous:', error);
      throw new Error(`Erreur lors de la suppression du rendez-vous: ${error.message}`);
    }
  }

  // Récupérer les statuts disponibles (pour les formulaires)
  static async getAvailableStatuts() {
    return [
      'En cours',
      'Avec comparution', 
      'Non comparution'
    ];
  }
}

export default RendezvousModel;
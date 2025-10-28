import pool from '../config/db.js';

class RendezvousModel {
  // Récupérer tous les rendez-vous
  static async getAllRendezvous() {
    try {
      const query = `
        SELECT * FROM rendezvous 
        ORDER BY date_rendez_vous DESC, heure_rendez_vous DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des rendez-vous: ${error.message}`);
    }
  }

  // Récupérer un rendez-vous par ID
  static async getRendezvousById(id) {
    try {
      const query = `SELECT * FROM rendezvous WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du rendez-vous: ${error.message}`);
    }
  }

  // Rechercher des rendez-vous
  static async searchRendezvous(term) {
    try {
      const searchTerm = `%${term}%`;
      const query = `
        SELECT * FROM rendezvous 
        WHERE infraction ILIKE $1
          OR commune ILIKE $1
          OR fokontany ILIKE $1
          OR nom_personne_r ILIKE $1
        ORDER BY date_rendez_vous DESC, heure_rendez_vous DESC
      `;
      const result = await pool.query(query, [searchTerm]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche des rendez-vous: ${error.message}`);
    }
  }

  // Mettre à jour le statut d'un rendez-vous
  static async updateStatut(id, statut) {
    try {
      const query = `
        UPDATE rendezvous 
        SET statut = $1
        WHERE id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [statut, id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  }

  // Récupérer les statistiques - MODIFIÉ POUR INCLURE LE TOTAL
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
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }
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
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de l'envoi de la mise en demeure: ${error.message}`);
    }
  }

  // Récupérer les rendez-vous éligibles pour mise en demeure (7 jours après la date)
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
      throw new Error(`Erreur lors de la vérification d'éligibilité: ${error.message}`);
    }
  }
}

export default RendezvousModel;
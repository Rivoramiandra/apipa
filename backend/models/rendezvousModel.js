// models/rendezvousModel.js
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
}

export default RendezvousModel;
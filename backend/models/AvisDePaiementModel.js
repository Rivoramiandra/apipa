import pool from "../config/db.js";

class AvisDePaiementModel {
  // Créer un nouvel avis de paiement
  static async create(apData) {
    try {
      const {
        date_ap,
        ref_ap,
        proprietaire,
        titre,
        immatriculation_propriete,
        localisation,
        destination,
        objet,
        id_objet,
        montant,
        refOR,
        montantrecouvrir,
        montantarecouvrir,
        etat = 'En attente'
      } = apData;

      const query = `
        INSERT INTO avisdepayement (
          date_ap, ref_ap, proprietaire, titre, immatriculation_propriete,
          localisation, destination, objet, id_objet, montant, refOR,
          montantrecouvrir, montantarecouvrir, etat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        date_ap,
        ref_ap,
        proprietaire,
        titre,
        immatriculation_propriete,
        localisation,
        destination,
        objet,
        id_objet,
        montant,
        refOR,
        montantrecouvrir,
        montantarecouvrir,
        etat
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.create:', error);
      throw error;
    }
  }

  // Récupérer tous les avis de paiement
  static async findAll() {
    try {
      const query = 'SELECT * FROM avisdepayement ORDER BY date_ap DESC, id DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.findAll:', error);
      throw error;
    }
  }

  // Récupérer un avis de paiement par ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM avisdepayement WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.findById:', error);
      throw error;
    }
  }

  // Récupérer un avis de paiement par référence
  static async findByReference(ref_ap) {
    try {
      const query = 'SELECT * FROM avisdepayement WHERE ref_ap = $1';
      const result = await pool.query(query, [ref_ap]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.findByReference:', error);
      throw error;
    }
  }

  // Mettre à jour un avis de paiement
  static async update(id, apData) {
    try {
      const {
        date_ap,
        ref_ap,
        proprietaire,
        titre,
        immatriculation_propriete,
        localisation,
        destination,
        objet,
        id_objet,
        montant,
        refOR,
        montantrecouvrir,
        montantarecouvrir,
        etat
      } = apData;

      const query = `
        UPDATE avisdepayement 
        SET date_ap = $1, ref_ap = $2, proprietaire = $3, titre = $4, 
            immatriculation_propriete = $5, localisation = $6, destination = $7,
            objet = $8, id_objet = $9, montant = $10, refOR = $11,
            montantrecouvrir = $12, montantarecouvrir = $13, etat = $14
        WHERE id = $15
        RETURNING *
      `;

      const values = [
        date_ap,
        ref_ap,
        proprietaire,
        titre,
        immatriculation_propriete,
        localisation,
        destination,
        objet,
        id_objet,
        montant,
        refOR,
        montantrecouvrir,
        montantarecouvrir,
        etat,
        id
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.update:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'un avis de paiement
  static async updateStatus(id, etat) {
    try {
      const query = 'UPDATE avisdepayement SET etat = $1 WHERE id = $2 RETURNING *';
      const result = await pool.query(query, [etat, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.updateStatus:', error);
      throw error;
    }
  }

  // Mettre à jour le montant recouvri
  static async updateMontantRecouvri(id, montantarecouvrir) {
    try {
      const query = 'UPDATE avisdepayement SET montantarecouvrir = $1 WHERE id = $2 RETURNING *';
      const result = await pool.query(query, [montantarecouvrir, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.updateMontantRecouvri:', error);
      throw error;
    }
  }

  // Supprimer un avis de paiement
  static async delete(id) {
    try {
      const query = 'DELETE FROM avisdepayement WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.delete:', error);
      throw error;
    }
  }

  // Vérifier si une référence AP existe déjà
  static async checkReferenceExists(ref_ap) {
    try {
      const query = 'SELECT id FROM avisdepayement WHERE ref_ap = $1';
      const result = await pool.query(query, [ref_ap]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.checkReferenceExists:', error);
      throw error;
    }
  }

  // Récupérer les statistiques
  static async getStats() {
    try {
      const allAP = await this.findAll();
      
      const total = allAP.length;
      const en_attente = allAP.filter(ap => ap.etat === 'En attente').length;
      const en_cours = allAP.filter(ap => ap.etat === 'En cours').length;
      const paye = allAP.filter(ap => ap.etat === 'Payé').length;
      const annule = allAP.filter(ap => ap.etat === 'Annulé').length;

      const montantTotal = allAP.reduce((sum, ap) => sum + parseFloat(ap.montant), 0);
      const montantRecouvri = allAP.reduce((sum, ap) => sum + parseFloat(ap.montantarecouvrir), 0);

      return {
        total,
        en_attente,
        en_cours,
        paye,
        annule,
        montant_total: montantTotal,
        montant_recouvri: montantRecouvri,
        montant_restant: montantTotal - montantRecouvri
      };
    } catch (error) {
      console.error('Erreur dans AvisDePaiementModel.getStats:', error);
      throw error;
    }
  }
}

export default AvisDePaiementModel;
// models/Paiement.js
import pool from '../config/db.js';

class Paiement {
  // Créer un nouveau paiement
  static async create(paymentData) {
    try {
      const query = `
        INSERT INTO paiements (
          ap_id, date_payment, method_payment, montant, reference_payment,
          notes, payment_type, montant_total, montant_reste,
          nombre_tranches, montant_tranche, numero_tranche, contact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        paymentData.ap_id,
        paymentData.date_payment,
        paymentData.method_payment,
        paymentData.montant,
        paymentData.reference_payment || null,
        paymentData.notes || null,
        paymentData.payment_type,
        paymentData.montant_total,
        paymentData.montant_reste,
        paymentData.nombre_tranches || null,
        paymentData.montant_tranche || null,
        paymentData.numero_tranche || 1,
        paymentData.contact || null // NOUVEAU: Ajout du contact
      ];

      console.log('📝 Requête SQL Paiement:', query);
      console.log('🔢 Paramètres:', values);

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.create:', error);
      throw error;
    }
  }

  // Récupérer tous les paiements
  static async findAll() {
    try {
      const query = `
        SELECT 
          p.*,
          a.reference_ft,
          a.num_ap,
          a.montant_chiffre,
          a.infraction,
          a.localite,
          a.statut as ap_statut,
          a.contact as ap_contact
        FROM paiements p
        INNER JOIN avisdepaiment a ON p.ap_id = a.id
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.findAll:', error);
      throw error;
    }
  }

  // Récupérer les paiements par AP ID
  static async findByApId(apId) {
    try {
      const query = `
        SELECT 
          p.*,
          a.reference_ft,
          a.num_ap,
          a.montant_chiffre,
          a.infraction,
          a.localite,
          a.contact as ap_contact
        FROM paiements p
        INNER JOIN avisdepaiment a ON p.ap_id = a.id
        WHERE p.ap_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, [apId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.findByApId:', error);
      throw error;
    }
  }

  // Récupérer un paiement par ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          p.*,
          a.reference_ft,
          a.num_ap,
          a.montant_chiffre,
          a.infraction,
          a.localite,
          a.statut as ap_statut,
          a.contact as ap_contact
        FROM paiements p
        INNER JOIN avisdepaiment a ON p.ap_id = a.id
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.findById:', error);
      throw error;
    }
  }

  // Vérifier si l'AP existe
  static async checkApExists(apId) {
    try {
      const query = 'SELECT id, contact FROM avisdepaiment WHERE id = $1';
      const result = await pool.query(query, [apId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.checkApExists:', error);
      throw error;
    }
  }

  // Calculer le total payé pour un AP
  static async getTotalPaidForAp(apId) {
    try {
      const query = `
        SELECT 
          COALESCE(SUM(montant), 0) as total_paye,
          COUNT(*) as nombre_paiements
        FROM paiements 
        WHERE ap_id = $1
      `;

      const result = await pool.query(query, [apId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.getTotalPaidForAp:', error);
      throw error;
    }
  }
}

export default Paiement;
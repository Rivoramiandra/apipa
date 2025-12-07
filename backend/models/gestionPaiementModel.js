import pool from "../config/db.js";

class GestionPaiementModel {
  static async create(paiementData) {
    const query = `
      INSERT INTO paiements (
        ap_id, date_payment, method_payment, montant, reference_payment, 
        notes, payment_type, montant_total, montant_reste, nombre_tranches, 
        montant_tranche, numero_tranche, contact, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      paiementData.ap_id,
      paiementData.date_payment,
      paiementData.method_payment,
      paiementData.montant,
      paiementData.reference_payment,
      paiementData.notes,
      paiementData.payment_type,
      paiementData.montant_total,
      paiementData.montant_reste,
      paiementData.nombre_tranches,
      paiementData.montant_tranche,
      paiementData.numero_tranche,
      paiementData.contact,
      paiementData.statut || 'Partiel'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `SELECT * FROM paiements ORDER BY created_at DESC`;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM paiements WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByApId(ap_id) {
    const query = 'SELECT * FROM paiements WHERE ap_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [ap_id]);
    return result.rows;
  }

  static async findByReference(reference_payment) {
    const query = 'SELECT * FROM paiements WHERE reference_payment = $1';
    const result = await pool.query(query, [reference_payment]);
    return result.rows[0];
  }

  static async update(id, paiementData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'ap_id', 'date_payment', 'method_payment', 'montant', 'reference_payment',
      'notes', 'payment_type', 'montant_total', 'montant_reste', 'nombre_tranches',
      'montant_tranche', 'numero_tranche', 'contact', 'statut'
    ];

    allowedFields.forEach(field => {
      if (paiementData[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(paiementData[field]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('Aucun champ à mettre à jour');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE paiements 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStatut(id, statut) {
    const query = `
      UPDATE paiements 
      SET statut = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [statut, id]);
    return result.rows[0];
  }

  static async updateMontant(id, montant) {
    const query = `
      UPDATE paiements 
      SET montant = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [montant, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM paiements WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async checkReferenceExists(reference_payment) {
    const query = 'SELECT id FROM paiements WHERE reference_payment = $1';
    const result = await pool.query(query, [reference_payment]);
    return result.rows.length > 0;
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_paiements,
        COUNT(DISTINCT ap_id) as total_avis_paiement,
        SUM(montant) as montant_total_percu,
        SUM(montant_total) as montant_total_attendu,
        SUM(montant_reste) as montant_total_reste,
        statut,
        method_payment,
        COUNT(*) FILTER (WHERE statut = 'Complété') as paiements_completes,
        COUNT(*) FILTER (WHERE statut = 'Partiel') as paiements_partiels
      FROM paiements 
      GROUP BY statut, method_payment
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getPaiementsByAvisPaiement(ap_id) {
    const query = `
      SELECT * FROM paiements 
      WHERE ap_id = $1 
      ORDER BY numero_tranche ASC, created_at ASC
    `;
    const result = await pool.query(query, [ap_id]);
    return result.rows;
  }

  static async getMontantRestantByApId(ap_id) {
    const query = `
      SELECT 
        montant_total - COALESCE(SUM(montant), 0) as montant_restant
      FROM paiements 
      WHERE ap_id = $1
      GROUP BY montant_total
    `;
    const result = await pool.query(query, [ap_id]);
    return result.rows[0]?.montant_restant || 0;
  }

  static async getStatsPaiements() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_paiements,
          COUNT(DISTINCT ap_id) as total_dossiers_paiement,
          SUM(montant) as montant_total_percu,
          COUNT(*) FILTER (WHERE statut = 'Complété') as paiements_completes,
          COUNT(*) FILTER (WHERE statut = 'Partiel') as paiements_partiels,
          COUNT(*) FILTER (WHERE statut = 'Acompte') as paiements_acompte,
          COUNT(*) FILTER (WHERE statut = 'Annulé') as paiements_annules,
          SUM(montant) FILTER (WHERE statut = 'Complété') as montant_completes,
          SUM(montant) FILTER (WHERE statut = 'Partiel') as montant_partiels,
          SUM(montant) FILTER (WHERE statut = 'Acompte') as montant_acompte,
          COUNT(*) FILTER (WHERE method_payment = 'Espèces') as paiements_especes,
          COUNT(*) FILTER (WHERE method_payment = 'Chèque') as paiements_cheque,
          COUNT(*) FILTER (WHERE method_payment = 'Virement') as paiements_virement,
          COUNT(*) FILTER (WHERE method_payment = 'Carte') as paiements_carte,
          TO_CHAR(date_payment, 'YYYY-MM') as mois,
          COUNT(*) as paiements_mois,
          SUM(montant) as montant_mois
        FROM paiements 
        WHERE date_payment >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(date_payment, 'YYYY-MM')
        ORDER BY mois DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur récupération stats paiements:', error);
      throw new Error(`Erreur récupération statistiques: ${error.message}`);
    }
  }

  static async getStatsPaiementsParMois(annee = null) {
    try {
      const anneeRecherche = annee || new Date().getFullYear();
      
      const query = `
        SELECT 
          TO_CHAR(date_payment, 'YYYY-MM') as mois,
          TO_CHAR(date_payment, 'Mon') as mois_court,
          TO_CHAR(date_payment, 'Month') as mois_complet,
          EXTRACT(YEAR FROM date_payment) as annee,
          COUNT(*) as total_paiements,
          SUM(montant) as montant_total,
          COUNT(*) FILTER (WHERE statut = 'Complété') as paiements_completes,
          COUNT(*) FILTER (WHERE statut = 'Partiel') as paiements_partiels,
          COUNT(*) FILTER (WHERE statut = 'Acompte') as paiements_acompte,
          SUM(montant) FILTER (WHERE statut = 'Complété') as montant_completes,
          SUM(montant) FILTER (WHERE statut = 'Partiel') as montant_partiels,
          SUM(montant) FILTER (WHERE statut = 'Acompte') as montant_acompte
        FROM paiements 
        WHERE EXTRACT(YEAR FROM date_payment) = $1
          AND date_payment IS NOT NULL
        GROUP BY 
          TO_CHAR(date_payment, 'YYYY-MM'),
          TO_CHAR(date_payment, 'Mon'),
          TO_CHAR(date_payment, 'Month'),
          EXTRACT(YEAR FROM date_payment)
        ORDER BY mois
      `;
      
      const result = await pool.query(query, [anneeRecherche]);
      return this.genererMoisCompletsPaiements(anneeRecherche, result.rows);
    } catch (error) {
      console.error('❌ Erreur récupération stats paiements par mois:', error);
      throw new Error(`Erreur récupération statistiques mensuelles: ${error.message}`);
    }
  }

  static async getStatsPaiementsParStatut() {
    try {
      const query = `
        SELECT 
          statut,
          COUNT(*) as nombre_paiements,
          SUM(montant) as montant_total,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM paiements)), 1) as pourcentage_nombre,
          ROUND((SUM(montant) * 100.0 / (SELECT SUM(montant) FROM paiements)), 1) as pourcentage_montant
        FROM paiements 
        WHERE statut IS NOT NULL
        GROUP BY statut
        ORDER BY nombre_paiements DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur récupération stats par statut:', error);
      throw new Error(`Erreur récupération statistiques par statut: ${error.message}`);
    }
  }

  static async getStatsPaiementsParMethode() {
    try {
      const query = `
        SELECT 
          COALESCE(method_payment, 'Non spécifié') as methode_paiement,
          COUNT(*) as nombre_paiements,
          SUM(montant) as montant_total,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM paiements)), 1) as pourcentage_nombre,
          ROUND((SUM(montant) * 100.0 / (SELECT SUM(montant) FROM paiements)), 1) as pourcentage_montant
        FROM paiements 
        GROUP BY method_payment
        ORDER BY nombre_paiements DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur récupération stats par méthode:', error);
      throw new Error(`Erreur récupération statistiques par méthode: ${error.message}`);
    }
  }

  static genererMoisCompletsPaiements(annee, donneesMois) {
    const mois = [
      { numero: '01', court: 'Jan', complet: 'January' },
      { numero: '02', court: 'Fév', complet: 'February' },
      { numero: '03', court: 'Mar', complet: 'March' },
      { numero: '04', court: 'Avr', complet: 'April' },
      { numero: '05', court: 'Mai', complet: 'May' },
      { numero: '06', court: 'Jun', complet: 'June' },
      { numero: '07', court: 'Jul', complet: 'July' },
      { numero: '08', court: 'Aoû', complet: 'August' },
      { numero: '09', court: 'Sep', complet: 'September' },
      { numero: '10', court: 'Oct', complet: 'October' },
      { numero: '11', court: 'Nov', complet: 'November' },
      { numero: '12', court: 'Déc', complet: 'December' }
    ];

    const donneesMap = new Map();
    donneesMois.forEach(donnee => {
      const moisNumero = donnee.mois.split('-')[1];
      donneesMap.set(moisNumero, donnee);
    });

    return mois.map(moisInfo => {
      const moisKey = `${annee}-${moisInfo.numero}`;
      const donneesExistantes = donneesMap.get(moisInfo.numero);
      
      if (donneesExistantes) {
        return {
          mois: moisKey,
          mois_court: moisInfo.court,
          mois_complet: moisInfo.complet,
          annee: annee,
          total_paiements: parseInt(donneesExistantes.total_paiements) || 0,
          montant_total: parseFloat(donneesExistantes.montant_total) || 0,
          paiements_completes: parseInt(donneesExistantes.paiements_completes) || 0,
          paiements_partiels: parseInt(donneesExistantes.paiements_partiels) || 0,
          paiements_acompte: parseInt(donneesExistantes.paiements_acompte) || 0,
          montant_completes: parseFloat(donneesExistantes.montant_completes) || 0,
          montant_partiels: parseFloat(donneesExistantes.montant_partiels) || 0,
          montant_acompte: parseFloat(donneesExistantes.montant_acompte) || 0
        };
      } else {
        return {
          mois: moisKey,
          mois_court: moisInfo.court,
          mois_complet: moisInfo.complet,
          annee: annee,
          total_paiements: 0,
          montant_total: 0,
          paiements_completes: 0,
          paiements_partiels: 0,
          paiements_acompte: 0,
          montant_completes: 0,
          montant_partiels: 0,
          montant_acompte: 0
        };
      }
    });
  }
}

export default GestionPaiementModel;
import pool from '../config/db.js';

class Paiement {
  // Créer un nouveau paiement avec gestion automatique du statut
  static async create(paymentData) {
    try {
      console.log('📦 Données reçues dans le modèle:', paymentData);

      // Récupérer le montant total de l'AP
      const apInfo = await this.checkApExists(paymentData.ap_id);
      if (!apInfo) {
        throw new Error('AP non trouvé');
      }

      const montantTotalAP = parseFloat(apInfo.montant_chiffre) || 0;
      const montantPaiement = parseFloat(paymentData.montant) || 0;

      // Calculer le total payé jusqu'à présent (y compris ce paiement)
      const totalPaidResult = await this.getTotalPaidForAp(paymentData.ap_id);
      const totalPayeActuel = parseFloat(totalPaidResult.total_paye) || 0;
      const totalPayeAvecNouveau = totalPayeActuel + montantPaiement;

      // Déterminer automatiquement le statut
      let statut = 'Partiel';
      
      if (paymentData.payment_type === 'acompte') {
        statut = 'acompte';
      } else if (paymentData.payment_type === 'tranche') {
        // Pour les tranches, vérifier si c'est la dernière tranche
        const nombreTranches = paymentData.nombre_tranches || paymentData.nombre_tranche || 1;
        const numeroTranche = paymentData.numero_tranche || 1;
        
        if (numeroTranche >= nombreTranches) {
          // Dernière tranche - vérifier si le montant total est atteint
          if (Math.abs(totalPayeAvecNouveau - montantTotalAP) < 0.01) {
            statut = 'Complété';
          } else {
            statut = 'Partiel';
          }
        } else {
          statut = 'Partiel';
        }
      } else if (paymentData.payment_type === 'Complété') {
        // Paiement complet - vérifier si le montant correspond
        if (Math.abs(montantPaiement - montantTotalAP) < 0.01) {
          statut = 'Complété';
        } else {
          statut = 'Partiel';
        }
      }

      // Vérifier si le paiement complète le montant total
      if (Math.abs(totalPayeAvecNouveau - montantTotalAP) < 0.01) {
        statut = 'Complété';
      }

      console.log(`💰 Calcul statut: Montant AP=${montantTotalAP}, Payé=${totalPayeAvecNouveau}, Statut=${statut}`);

      const query = `
        INSERT INTO paiements (
          ap_id, date_payment, method_payment, montant, reference_payment,
          notes, payment_type, montant_total, montant_reste,
          nombre_tranche, montant_tranche, numero_tranche, contact, statut
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        paymentData.ap_id,
        paymentData.date_payment,
        paymentData.method_payment,
        montantPaiement,
        paymentData.reference_payment || null,
        paymentData.notes || null,
        paymentData.payment_type,
        montantTotalAP,
        Math.max(0, montantTotalAP - totalPayeAvecNouveau),
        paymentData.nombre_tranches || paymentData.nombre_tranche || null,
        parseFloat(paymentData.montant_tranche) || null,
        paymentData.numero_tranche || 1,
        paymentData.contact || apInfo.contact || null,
        statut
      ];

      console.log('📝 Requête SQL Paiement:', query);
      console.log('🔢 Paramètres:', values);

      const result = await pool.query(query, values);
      
      // Mettre à jour le statut de l'AP après création du paiement
      await this.updatePaymentStatus(paymentData.ap_id);
      
      console.log('✅ Paiement créé avec succès. Statut:', statut);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.create:', error);
      throw error;
    }
  }

  // Mettre à jour automatiquement le statut après chaque paiement
  static async updatePaymentStatus(apId) {
    try {
      const apInfo = await this.checkApExists(apId);
      if (!apInfo) {
        throw new Error('AP non trouvé');
      }

      const montantTotalAP = parseFloat(apInfo.montant_chiffre) || 0;
      const totalPaidResult = await this.getTotalPaidForAp(apId);
      const totalPaye = parseFloat(totalPaidResult.total_paye) || 0;

      let nouveauStatut = 'Partiel';
      
      // Vérifier si le paiement est complet
      if (Math.abs(totalPaye - montantTotalAP) < 0.01) {
        nouveauStatut = 'Complété';
      } else if (totalPaye > 0) {
        nouveauStatut = 'Partiel';
      } else {
        nouveauStatut = 'en_attente';
      }

      console.log(`🔄 Mise à jour statut AP ${apId}: ${totalPaye}/${montantTotalAP} = ${nouveauStatut}`);

      // Mettre à jour le statut de l'AP si nécessaire
      if (apInfo.statut !== nouveauStatut) {
        const updateApQuery = `
          UPDATE avisdepaiment 
          SET statut = $1, update_at = NOW()
          WHERE id = $2
        `;
        await pool.query(updateApQuery, [nouveauStatut, apId]);
        console.log(`✅ Statut AP ${apId} mis à jour: ${nouveauStatut}`);
      }

      return nouveauStatut;
    } catch (error) {
      console.error('❌ Erreur dans updatePaymentStatus:', error);
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
          a.contact as ap_contact,
          -- Calculer le pourcentage payé
          CASE 
            WHEN a.montant_chiffre > 0 THEN 
              ROUND((COALESCE(p.montant, 0) / a.montant_chiffre) * 100, 2)
            ELSE 0
          END as pourcentage_paye
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

  // Récupérer les paiements par AP ID avec statut détaillé
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
          a.contact as ap_contact,
          a.statut as ap_statut,
          -- Calculer le pourcentage payé pour chaque paiement
          CASE 
            WHEN a.montant_chiffre > 0 THEN 
              ROUND((COALESCE(p.montant, 0) / a.montant_chiffre) * 100, 2)
            ELSE 0
          END as pourcentage_paye,
          -- Calculer le total payé cumulé
          (
            SELECT COALESCE(SUM(montant), 0) 
            FROM paiements p2 
            WHERE p2.ap_id = p.ap_id 
            AND p2.created_at <= p.created_at
          ) as total_cumule,
          -- Calculer le pourcentage cumulé
          CASE 
            WHEN a.montant_chiffre > 0 THEN 
              ROUND((
                SELECT COALESCE(SUM(montant), 0) 
                FROM paiements p2 
                WHERE p2.ap_id = p.ap_id 
                AND p2.created_at <= p.created_at
              ) / a.montant_chiffre * 100, 2)
            ELSE 0
          END as pourcentage_cumule
        FROM paiements p
        INNER JOIN avisdepaiment a ON p.ap_id = a.id
        WHERE p.ap_id = $1
        ORDER BY p.created_at ASC
      `;

      const result = await pool.query(query, [apId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.findByApId:', error);
      throw error;
    }
  }

  // Récupérer un paiement par ID avec informations détaillées
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
          a.contact as ap_contact,
          -- Calculer le total payé pour cet AP
          (
            SELECT COALESCE(SUM(montant), 0) 
            FROM paiements 
            WHERE ap_id = p.ap_id
          ) as total_paye_ap,
          -- Calculer le pourcentage total payé
          CASE 
            WHEN a.montant_chiffre > 0 THEN 
              ROUND((
                SELECT COALESCE(SUM(montant), 0) 
                FROM paiements 
                WHERE ap_id = p.ap_id
              ) / a.montant_chiffre * 100, 2)
            ELSE 0
          END as pourcentage_total_paye
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
      const query = 'SELECT id, reference_ft, num_ap, contact, montant_chiffre, statut FROM avisdepaiment WHERE id = $1';
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
          COUNT(*) as nombre_paiements,
          MAX(date_payment) as dernier_paiement,
          -- Calculer le statut basé sur le montant total
          CASE 
            WHEN (SELECT montant_chiffre FROM avisdepaiment WHERE id = $1) > 0 THEN
              CASE 
                WHEN COALESCE(SUM(montant), 0) >= (SELECT montant_chiffre FROM avisdepaiment WHERE id = $1) THEN 'Complété'
                WHEN COALESCE(SUM(montant), 0) > 0 THEN 'Partiel'
                ELSE 'en_attente'
              END
            ELSE 'inconnu'
          END as statut_calculé
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

  // Mettre à jour le statut d'un paiement
  static async updateStatut(id, statut) {
    try {
      const query = `
        UPDATE paiements 
        SET statut = $1, update_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [statut, id]);
      
      // Mettre à jour le statut de l'AP après modification
      if (result.rows[0]) {
        await this.updatePaymentStatus(result.rows[0].ap_id);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.updateStatut:', error);
      throw error;
    }
  }

  // Mettre à jour un paiement
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      // Construire dynamiquement la requête UPDATE
      Object.keys(updateData).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      // Ajouter la date de mise à jour
      fields.push('update_at = NOW()');
      
      values.push(id);

      const query = `
        UPDATE paiements 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      // Mettre à jour le statut de l'AP après modification
      if (result.rows[0]) {
        await this.updatePaymentStatus(result.rows[0].ap_id);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.update:', error);
      throw error;
    }
  }

  // Supprimer un paiement
  static async delete(id) {
    try {
      // Récupérer l'AP ID avant suppression
      const paiement = await this.findById(id);
      const apId = paiement ? paiement.ap_id : null;

      const query = 'DELETE FROM paiements WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      
      // Mettre à jour le statut de l'AP après suppression
      if (apId) {
        await this.updatePaymentStatus(apId);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.delete:', error);
      throw error;
    }
  }

  // Récupérer les statistiques générales des paiements
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_paiements,
          COALESCE(SUM(montant), 0) as total_montant,
          COUNT(DISTINCT ap_id) as total_ap,
          AVG(montant) as moyenne_montant,
          MIN(date_payment) as premier_paiement,
          MAX(date_payment) as dernier_paiement,
          -- Statistiques par statut
          COUNT(*) FILTER (WHERE statut = 'Complété') as paiements_complets,
          COUNT(*) FILTER (WHERE statut = 'Partiel') as paiements_partiels,
          COUNT(*) FILTER (WHERE statut = 'acompte') as paiements_acomptes,
          COUNT(*) FILTER (WHERE statut = 'annule') as paiements_annules,
          -- Montants par statut
          COALESCE(SUM(montant) FILTER (WHERE statut = 'Complété'), 0) as montant_complets,
          COALESCE(SUM(montant) FILTER (WHERE statut = 'Partiel'), 0) as montant_partiels,
          COALESCE(SUM(montant) FILTER (WHERE statut = 'acompte'), 0) as montant_acomptes
        FROM paiements
      `;

      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.getStats:', error);
      throw error;
    }
  }

  // Récupérer les paiements par méthode de paiement
  static async findByMethod(method) {
    try {
      const query = `
        SELECT 
          p.*,
          a.reference_ft,
          a.num_ap,
          a.montant_chiffre
        FROM paiements p
        INNER JOIN avisdepaiment a ON p.ap_id = a.id
        WHERE p.method_payment = $1
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, [method]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.findByMethod:', error);
      throw error;
    }
  }

  // Récupérer les paiements par période
  static async findByPeriod(startDate, endDate) {
    try {
      const query = `
        SELECT 
          p.*,
          a.reference_ft,
          a.num_ap,
          a.montant_chiffre
        FROM paiements p
        INNER JOIN avisdepaiment a ON p.ap_id = a.id
        WHERE p.date_payment BETWEEN $1 AND $2
        ORDER BY p.date_payment DESC
      `;

      const result = await pool.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.findByPeriod:', error);
      throw error;
    }
  }

  // Vérifier si une référence de paiement existe déjà
  static async checkReferenceExists(reference, excludeId = null) {
    try {
      let query = 'SELECT id FROM paiements WHERE reference_payment = $1';
      const params = [reference];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await pool.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.checkReferenceExists:', error);
      throw error;
    }
  }

  // Récupérer le prochain numéro de tranche pour un AP
  static async getNextTrancheNumber(apId) {
    try {
      const query = `
        SELECT COALESCE(MAX(numero_tranche), 0) + 1 as next_tranche
        FROM paiements 
        WHERE ap_id = $1
      `;

      const result = await pool.query(query, [apId]);
      return result.rows[0].next_tranche;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.getNextTrancheNumber:', error);
      throw error;
    }
  }

  // Marquer un paiement comme annulé
  static async cancelPayment(id, motifAnnulation) {
    try {
      const query = `
        UPDATE paiements 
        SET statut = 'annule', notes = CONCAT(COALESCE(notes, ''), ' - ANNULE: ', $1), update_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [motifAnnulation, id]);
      
      // Mettre à jour le statut de l'AP après annulation
      if (result.rows[0]) {
        await this.updatePaymentStatus(result.rows[0].ap_id);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans Paiement.cancelPayment:', error);
      throw error;
    }
  }

  // Récupérer l'historique des paiements d'un AP avec détails
  static async getPaymentHistory(apId) {
    try {
      const query = `
        SELECT 
          p.id,
          p.date_payment,
          p.method_payment,
          p.montant,
          p.reference_payment,
          p.payment_type,
          p.numero_tranche,
          p.nombre_tranche,
          p.montant_tranche,
          p.statut,
          p.notes,
          p.created_at,
          a.montant_chiffre as montant_total_ap,
          (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE ap_id = $1) as total_paye_global
        FROM paiements p
        INNER JOIN avisdepaiment a ON p.ap_id = a.id
        WHERE p.ap_id = $1
        ORDER BY p.date_payment DESC, p.created_at DESC
      `;

      const result = await pool.query(query, [apId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans Paiement.getPaymentHistory:', error);
      throw error;
    }
  }

  // Obtenir le résumé des paiements pour un AP
  static async getPaymentSummary(apId) {
    try {
      const apInfo = await this.checkApExists(apId);
      if (!apInfo) {
        throw new Error('AP non trouvé');
      }

      const totalPaid = await this.getTotalPaidForAp(apId);
      const paiements = await this.findByApId(apId);

      const montantTotal = parseFloat(apInfo.montant_chiffre) || 0;
      const totalPaye = parseFloat(totalPaid.total_paye) || 0;
      const montantRestant = Math.max(0, montantTotal - totalPaye);
      const pourcentagePaye = montantTotal > 0 ? (totalPaye / montantTotal) * 100 : 0;

      return {
        ap_info: apInfo,
        resume: {
          montant_total: montantTotal,
          total_paye: totalPaye,
          montant_restant: montantRestant,
          pourcentage_paye: Math.round(pourcentagePaye * 100) / 100,
          nombre_paiements: totalPaid.nombre_paiements,
          statut_global: totalPaye >= montantTotal ? 'Complété' : totalPaye > 0 ? 'Partiel' : 'en_attente'
        },
        historique: paiements
      };
    } catch (error) {
      console.error('❌ Erreur dans Paiement.getPaymentSummary:', error);
      throw error;
    }
  }
}

export default Paiement;
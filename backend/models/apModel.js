// models/ApModel.js
import pool from "../config/db.js";

class ApModel {
    
    static async getAllAP() {
        try {
            const query = `
                SELECT 
                    id, 
                    id_ft,
                    reference_ft, 
                    date_ft, 
                    heure_ft, 
                    status_dossier,
                    statut,
                    num_ap,
                    date_ap,
                    titre_terrain,
                    superficie,
                    zone_geographique,
                    pu_plan_urbanisme,
                    destination_terrain,
                    montant_chiffre,
                    montant_lettre,
                    delai_payment,
                    date_delai_payment,
                    contact,
                    date_mise_a_jour,
                    last_payment_date,
                    notes,
                    created_at,
                    update_at
                FROM 
                    avisdepaiment
                ORDER BY
                    date_ft DESC, id DESC;
            `;

            const result = await pool.query(query);
            return result.rows;
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.getAllAP:", error);
            throw new Error("Erreur lors de la récupération des avis de paiement.");
        }
    }

    static async getFTWithoutAP() {
        try {
            console.log('🔄 ApModel.getFTWithoutAP: Récupération des FT sans AP');
            
            const query = `
                SELECT 
                    id, 
                    id_ft,
                    reference_ft, 
                    date_ft, 
                    heure_ft, 
                    status_dossier,
                    statut,
                    created_at,
                    update_at
                FROM 
                    avisdepaiment
                WHERE 
                    num_ap IS NULL 
                    OR num_ap = ''
                    OR statut = 'en cours'
                ORDER BY
                    date_ft DESC, id DESC;
            `;

            const result = await pool.query(query);
            
            console.log(`✅ ApModel.getFTWithoutAP: ${result.rows.length} FT sans AP trouvés`);
            return result.rows;
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.getFTWithoutAP:", error);
            throw new Error("Erreur lors de la récupération des FT sans AP.");
        }
    }

    static async getFTById(ftId) {
        try {
            console.log(`🔄 ApModel.getFTById: Récupération du FT ID: ${ftId}`);
            
            const query = `
                SELECT 
                    id,
                    id_descente,
                    id_rendezvous,
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
                    superficie,
                    motif,
                    lieu,
                    but,
                    mesure,
                    dossier_type,
                    num_pv,
                    dossier,
                    status_dossier,
                    missing_dossires,
                    duration_complement,
                    deadline_complement,
                    created_at,
                    updated_at
                FROM ft_table
                WHERE id = $1
            `;
            
            const result = await pool.query(query, [ftId]);
            
            if (result.rows.length === 0) {
                console.log(`❌ ApModel.getFTById: FT non trouvé pour ID: ${ftId}`);
                throw new Error(`Fait-terrain avec ID ${ftId} non trouvé`);
            }
            
            console.log(`✅ ApModel.getFTById: FT trouvé: ${result.rows[0].reference_ft}`);
            return result.rows[0];
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.getFTById:", error);
            throw new Error(`Erreur lors de la récupération du fait-terrain: ${error.message}`);
        }
    }

    static async getFTByReference(referenceFT) {
        try {
            console.log(`🔄 ApModel.getFTByReference: Récupération du FT: ${referenceFT}`);
            
            const query = `
                SELECT 
                    id,
                    id_descente,
                    id_rendezvous,
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
                    superficie,
                    motif,
                    lieu,
                    but,
                    mesure,
                    dossier_type,
                    num_pv,
                    dossier,
                    status_dossier,
                    missing_dossires,
                    duration_complement,
                    deadline_complement,
                    created_at,
                    updated_at
                FROM ft_table 
                WHERE reference_ft = $1
            `;
            
            const result = await pool.query(query, [referenceFT]);
            
            if (result.rows.length === 0) {
                console.log(`❌ ApModel.getFTByReference: FT non trouvé: ${referenceFT}`);
                throw new Error(`Fait-terrain avec référence ${referenceFT} non trouvé`);
            }
            
            console.log(`✅ ApModel.getFTByReference: FT trouvé: ${result.rows[0].reference_ft}`);
            return result.rows[0];
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.getFTByReference:", error);
            throw new Error(`Erreur lors de la récupération du fait-terrain: ${error.message}`);
        }
    }

    static async getAPByFTId(ftId) {
        try {
            console.log(`🔄 ApModel.getAPByFTId: Récupération AP pour FT ID: ${ftId}`);
            
            const query = `
                SELECT * FROM avisdepaiment 
                WHERE id_ft = $1
                ORDER BY id DESC
                LIMIT 1
            `;
            
            const result = await pool.query(query, [ftId]);
            
            if (result.rows.length === 0) {
                console.log(`❌ ApModel.getAPByFTId: Aucun AP trouvé pour FT ID: ${ftId}`);
                throw new Error(`Aucun avis de paiement trouvé pour le fait-terrain ID ${ftId}`);
            }

            console.log(`✅ ApModel.getAPByFTId: AP trouvé ID: ${result.rows[0].id}`);
            return result.rows[0];
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.getAPByFTId:", error);
            throw new Error(`Erreur lors de la récupération de l'avis de paiement: ${error.message}`);
        }
    }

    static async create(apData) {
        try {
            console.log('🔄 ApModel.create: Création AP avec données:', apData);
            
            const {
                num_ap,
                date_ap,
                superficie,
                zone_geographique,
                pu_plan_urbanisme,
                montant_chiffre,
                montant_lettre,
                statut,
                date_delai_payment,
                id_ft,
                reference_ft,
                date_ft,
                heure_ft,
                status_dossier,
                titre_terrain,
                destination_terrain,
                contact,
                notes
            } = apData;

            if (!id_ft) {
                throw new Error('id_ft est requis');
            }

            const ft = await this.getFTById(id_ft);

            // Calcul du délai de paiement en jours (integer)
            let delaiPaymentDays = null;
            let effectiveDateDelaiPayment = date_delai_payment;

            if (date_delai_payment && date_ap) {
                try {
                    const dateAp = new Date(date_ap);
                    const dateDelai = new Date(date_delai_payment);
                    
                    if (!isNaN(dateAp.getTime()) && !isNaN(dateDelai.getTime())) {
                        const diffTime = dateDelai - dateAp;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 0) {
                            delaiPaymentDays = diffDays;
                        } else {
                            delaiPaymentDays = null;
                            effectiveDateDelaiPayment = null;
                        }
                    }
                } catch (dateError) {
                    console.warn('⚠️ Erreur de conversion de date pour le délai de paiement:', dateError);
                    delaiPaymentDays = null;
                    effectiveDateDelaiPayment = null;
                }
            }

            // Préparation des données effectives
            const effective = {
                id_ft: id_ft,
                reference_ft: reference_ft || ft.reference_ft || '',
                date_ft: date_ft || ft.date_ft || new Date().toISOString().split('T')[0],
                heure_ft: heure_ft || ft.heure_ft || '00:00',
                status_dossier: status_dossier || ft.status_dossier || '',
                statut: statut || 'fini',
                num_ap: num_ap || '',
                date_ap: date_ap || new Date().toISOString().split('T')[0],
                titre_terrain: titre_terrain || ft.titre_terrain || '',
                superficie: parseFloat(superficie) || ft.superficie || 0,
                zone_geographique: zone_geographique || '',
                pu_plan_urbanisme: pu_plan_urbanisme || '',
                destination_terrain: destination_terrain || ft.but || '',
                montant_chiffre: parseFloat(montant_chiffre) || 0,
                montant_lettre: montant_lettre || '',
                delai_payment: delaiPaymentDays,
                date_delai_payment: effectiveDateDelaiPayment,
                contact: contact || ft.contact || '',
                notes: notes || ''
            };

            // Vérifier si une ligne existe déjà pour ce FT
            const checkQuery = `
                SELECT id, num_ap 
                FROM avisdepaiment 
                WHERE id_ft = $1 AND (num_ap IS NULL OR num_ap = '')
            `;
            
            const checkResult = await pool.query(checkQuery, [id_ft]);
            
            let result;

            if (checkResult.rows.length > 0) {
                // Mise à jour de la ligne existante
                console.log('📝 Mise à jour de la ligne FT existante ID:', checkResult.rows[0].id);
                
                const updateQuery = `
                    UPDATE avisdepaiment 
                    SET 
                        num_ap = $1,
                        date_ap = $2,
                        titre_terrain = $3,
                        superficie = $4,
                        zone_geographique = $5,
                        pu_plan_urbanisme = $6,
                        destination_terrain = $7,
                        montant_chiffre = $8,
                        montant_lettre = $9,
                        statut = $10,
                        delai_payment = $11,
                        date_delai_payment = $12,
                        contact = $13,
                        notes = $14,
                        update_at = CURRENT_TIMESTAMP
                    WHERE id_ft = $15 AND (num_ap IS NULL OR num_ap = '')
                    RETURNING *;
                `;

                const values = [
                    effective.num_ap,
                    effective.date_ap,
                    effective.titre_terrain,
                    effective.superficie,
                    effective.zone_geographique,
                    effective.pu_plan_urbanisme,
                    effective.destination_terrain,
                    effective.montant_chiffre,
                    effective.montant_lettre,
                    effective.statut,
                    effective.delai_payment,
                    effective.date_delai_payment,
                    effective.contact,
                    effective.notes,
                    effective.id_ft
                ];

                console.log('📝 ApModel.create: Exécution de la requête UPDATE...');
                
                result = await pool.query(updateQuery, values);
                
            } else {
                // Insertion nouvelle ligne
                console.log('📝 Insertion nouvelle ligne AP');
                
                const insertQuery = `
                    INSERT INTO avisdepaiment (
                        id_ft,
                        reference_ft,
                        date_ft,
                        heure_ft,
                        status_dossier,
                        statut,
                        num_ap,
                        date_ap,
                        titre_terrain,
                        superficie,
                        zone_geographique,
                        pu_plan_urbanisme,
                        destination_terrain,
                        montant_chiffre,
                        montant_lettre,
                        delai_payment,
                        date_delai_payment,
                        contact,
                        notes,
                        created_at,
                        update_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15, $16, $17, $18, $19,
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                    RETURNING *;
                `;

                const values = [
                    effective.id_ft,
                    effective.reference_ft,
                    effective.date_ft,
                    effective.heure_ft,
                    effective.status_dossier,
                    effective.statut,
                    effective.num_ap,
                    effective.date_ap,
                    effective.titre_terrain,
                    effective.superficie,
                    effective.zone_geographique,
                    effective.pu_plan_urbanisme,
                    effective.destination_terrain,
                    effective.montant_chiffre,
                    effective.montant_lettre,
                    effective.delai_payment,
                    effective.date_delai_payment,
                    effective.contact,
                    effective.notes
                ];

                console.log('📝 ApModel.create: Exécution de la requête INSERT...');
                
                result = await pool.query(insertQuery, values);
            }
            
            console.log('✅ ApModel.create: AP créé/mis à jour avec succès, ID:', result.rows[0].id);
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Erreur dans ApModel.create:', error);
            throw new Error(`Erreur lors de la création de l'avis de paiement: ${error.message}`);
        }
    }

    static async update(id, apData) {
        try {
            console.log(`🔄 ApModel.update: Mise à jour AP ID: ${id}`, apData);
            
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Champs autorisés dans la table avisdepaiment
            const allowedFields = [
                'id_ft', 'reference_ft', 'date_ft', 'heure_ft', 'status_dossier',
                'statut', 'num_ap', 'date_ap', 'titre_terrain', 'superficie',
                'zone_geographique', 'pu_plan_urbanisme', 'destination_terrain',
                'montant_chiffre', 'montant_lettre', 'delai_payment', 'date_delai_payment',
                'contact', 'date_mise_a_jour', 'last_payment_date', 'notes'
            ];

            for (const [key, value] of Object.entries(apData)) {
                if (value !== undefined && key !== 'id' && allowedFields.includes(key)) {
                    if (key === 'date_delai_payment') {
                        fields.push(`date_delai_payment = $${paramCount}`);
                        values.push(value);
                        paramCount++;
                        
                        // Calculer aussi delai_payment (integer) si date_ap est disponible
                        if (apData.date_ap) {
                            try {
                                const dateAp = new Date(apData.date_ap);
                                const dateDelai = new Date(value);
                                
                                if (!isNaN(dateAp.getTime()) && !isNaN(dateDelai.getTime())) {
                                    const diffTime = dateDelai - dateAp;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    if (diffDays > 0) {
                                        fields.push(`delai_payment = $${paramCount}`);
                                        values.push(diffDays);
                                        paramCount++;
                                    } else {
                                        fields.push(`delai_payment = $${paramCount}`);
                                        values.push(null);
                                        paramCount++;
                                    }
                                }
                            } catch (dateError) {
                                console.warn('⚠️ Erreur de conversion de date pour le délai de paiement:', dateError);
                                fields.push(`delai_payment = $${paramCount}`);
                                values.push(null);
                                paramCount++;
                            }
                        }
                    } else {
                        fields.push(`${key} = $${paramCount}`);
                        values.push(value !== null ? value : null);
                        paramCount++;
                    }
                }
            }

            if (fields.length === 0) {
                console.warn('⚠️ Aucun champ valide à mettre à jour pour AP ID:', id);
                const existingAP = await this.getById(id);
                return existingAP;
            }

            fields.push('update_at = CURRENT_TIMESTAMP');
            values.push(id);

            const query = `
                UPDATE avisdepaiment 
                SET ${fields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *;
            `;

            console.log('📝 ApModel.update: Exécution de la requête');
            console.log('📋 Valeurs:', values);

            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Avis de paiement avec ID ${id} non trouvé`);
            }

            console.log(`✅ ApModel.update: AP mis à jour: ${id}`);
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Erreur dans ApModel.update:', error);
            throw new Error(`Erreur lors de la mise à jour de l'avis de paiement: ${error.message}`);
        }
    }

    static async updateMiseEnDemeure(id, updateData) {
        try {
            console.log(`🔄 ApModel.updateMiseEnDemeure: Mise à jour AP ID: ${id}`, updateData);
            
            const { 
                date_delai_payment, 
                date_mise_a_jour,
                statut = 'attente de paiement'
            } = updateData;

            const existingAP = await this.getById(id);

            const fields = [
                'statut = $1',
                'date_mise_a_jour = $2',
                'update_at = CURRENT_TIMESTAMP'
            ];
            const values = [statut, date_mise_a_jour || new Date().toISOString().split('T')[0]];
            let paramCount = 3;

            if (date_delai_payment) {
                fields.push(`date_delai_payment = $${paramCount}`);
                values.push(date_delai_payment);
                paramCount++;

                // Calculer le délai en jours (integer) si date_ap existe
                if (existingAP.date_ap) {
                    try {
                        const dateAp = new Date(existingAP.date_ap);
                        const dateDelai = new Date(date_delai_payment);
                        
                        if (!isNaN(dateAp.getTime()) && !isNaN(dateDelai.getTime())) {
                            const diffTime = dateDelai - dateAp;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays > 0) {
                                fields.push(`delai_payment = $${paramCount}`);
                                values.push(diffDays);
                                paramCount++;
                            } else {
                                fields.push(`delai_payment = $${paramCount}`);
                                values.push(null);
                                paramCount++;
                            }
                        }
                    } catch (dateError) {
                        console.warn('⚠️ Erreur de conversion de date pour le délai de paiement:', dateError);
                        fields.push(`delai_payment = $${paramCount}`);
                        values.push(null);
                        paramCount++;
                    }
                }
            }

            values.push(id);

            const query = `
                UPDATE avisdepaiment 
                SET ${fields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *;
            `;

            console.log('📝 ApModel.updateMiseEnDemeure: Exécution de la requête');
            
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Avis de paiement avec ID ${id} non trouvé`);
            }

            console.log(`✅ ApModel.updateMiseEnDemeure: AP mis à jour: ${id}`);
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Erreur dans ApModel.updateMiseEnDemeure:', error);
            throw new Error(`Erreur lors de la mise à jour de la mise en demeure: ${error.message}`);
        }
    }

    static async updateAPStatut(id, updateData) {
        try {
            console.log(`🔄 ApModel.updateAPStatut: Mise à jour statut AP ID: ${id}`, updateData);
            
            const { statut, date_mise_a_jour, last_payment_date } = updateData;

            const existingAP = await this.getById(id);

            const fields = ['statut = $1', 'update_at = CURRENT_TIMESTAMP'];
            const values = [statut];
            let paramCount = 2;

            if (date_mise_a_jour) {
                fields.push(`date_mise_a_jour = $${paramCount}`);
                values.push(date_mise_a_jour);
                paramCount++;
            }

            if (last_payment_date) {
                fields.push(`last_payment_date = $${paramCount}`);
                values.push(last_payment_date);
                paramCount++;
            }

            values.push(id);

            const query = `
                UPDATE avisdepaiment 
                SET ${fields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *;
            `;

            console.log('📝 ApModel.updateAPStatut: Exécution de la requête');

            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Avis de paiement avec ID ${id} non trouvé`);
            }

            console.log(`✅ ApModel.updateAPStatut: Statut AP mis à jour: ${id} -> ${statut}`);
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Erreur dans ApModel.updateAPStatut:', error);
            throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
        }
    }

    static async updateStatutWithMotif(id, updateData) {
        try {
            console.log(`🔄 ApModel.updateStatutWithMotif: Mise à jour AP ID: ${id}`, updateData);
            
            const { statut } = updateData;

            const query = `
                UPDATE avisdepaiment 
                SET 
                    statut = $1,
                    update_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *;
            `;

            const values = [statut, id];

            console.log('📝 ApModel.updateStatutWithMotif: Exécution de la requête');
            
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Avis de paiement avec ID ${id} non trouvé`);
            }

            console.log(`✅ ApModel.updateStatutWithMotif: Statut AP mis à jour: ${id} -> ${statut}`);
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Erreur dans ApModel.updateStatutWithMotif:', error);
            throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
        }
    }

    static async getOverdueAPs() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            console.log(`🔍 ApModel.getOverdueAPs: Recherche AP échus - ${today}`);
            
            const query = `
                SELECT 
                    id, 
                    id_ft, 
                    reference_ft, 
                    num_ap,
                    statut,
                    date_delai_payment,
                    montant_chiffre,
                    contact,
                    created_at
                FROM 
                    avisdepaiment
                WHERE 
                    statut = 'en attente de paiement'
                    AND date_delai_payment IS NOT NULL
                    AND date_delai_payment <= $1  
                ORDER BY 
                    date_delai_payment ASC;
            `;

            const result = await pool.query(query, [today]);
            
            console.log(`✅ ApModel.getOverdueAPs: ${result.rows.length} AP(s) échus trouvés`);
            
            result.rows.forEach(ap => {
                console.log(`📋 AP ${ap.id}: ${ap.num_ap} - Échu le ${ap.date_delai_payment} (${ap.statut})`);
            });
            
            return result.rows;
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.getOverdueAPs:", error);
            throw new Error("Erreur lors de la récupération des AP échus.");
        }
    }

    static async checkAndUpdateOverdueAPs() {
        try {
            console.log('🔍 ApModel.checkAndUpdateOverdueAPs: Vérification automatique des AP en retard');
            
            const overdueAPs = await this.getOverdueAPs();
            
            console.log(`📊 ${overdueAPs.length} AP(s) en retard à traiter`);
            
            const results = {
                totalChecked: overdueAPs.length,
                successfulUpdates: 0,
                failedUpdates: 0,
                details: []
            };

            for (const ap of overdueAPs) {
                try {
                    const updatedAP = await this.updateStatutWithMotif(ap.id, {
                        statut: 'non comparution'
                    });
                    
                    results.successfulUpdates++;
                    results.details.push({
                        id: ap.id,
                        num_ap: ap.num_ap,
                        status: 'success',
                        new_statut: 'non comparution'
                    });
                    
                    console.log(`✅ AP ${ap.id} (${ap.num_ap}) mis à jour en "non comparution"`);
                    
                } catch (error) {
                    results.failedUpdates++;
                    results.details.push({
                        id: ap.id,
                        num_ap: ap.num_ap,
                        status: 'error',
                        error: error.message
                    });
                    
                    console.error(`❌ Erreur mise à jour AP ${ap.id}:`, error);
                }
            }

            console.log(`✅ ApModel.checkAndUpdateOverdueAPs: Terminé - ${results.successfulUpdates} mis à jour, ${results.failedUpdates} erreurs`);
            return results;
            
        } catch (error) {
            console.error('❌ Erreur dans ApModel.checkAndUpdateOverdueAPs:', error);
            throw new Error("Erreur lors de la vérification automatique des AP en retard.");
        }
    }

    static async getById(id) {
        try {
            const query = `
                SELECT * FROM avisdepaiment 
                WHERE id = $1
            `;
            
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                throw new Error(`Avis de paiement avec ID ${id} non trouvé`);
            }

            return result.rows[0];
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.getById:", error);
            throw new Error(`Erreur lors de la récupération de l'avis de paiement: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const query = `
                DELETE FROM avisdepaiment 
                WHERE id = $1 
                RETURNING *;
            `;
            
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                throw new Error(`Avis de paiement avec ID ${id} non trouvé`);
            }

            return result.rows[0];
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.delete:", error);
            throw new Error(`Erreur lors de la suppression de l'avis de paiement: ${error.message}`);
        }
    }

    static async updateAPFromFT(ftId, apData) {
        try {
            console.log(`🔄 ApModel.updateAPFromFT: Mise à jour AP pour FT ID: ${ftId}`);
            
            const existingAP = await this.getAPByFTId(ftId);
            
            const {
                num_ap,
                date_ap,
                superficie,
                zone_geographique,
                pu_plan_urbanisme,
                montant_chiffre,
                montant_lettre,
                statut,
                date_delai_payment,
                titre_terrain,
                destination_terrain,
                contact,
                notes
            } = apData;

            // Vérifier si le num_ap existe déjà pour un autre AP
            if (num_ap && num_ap !== existingAP.num_ap) {
                const checkNumAPQuery = `
                    SELECT id FROM avisdepaiment 
                    WHERE num_ap = $1 AND id_ft != $2
                `;
                const checkResult = await pool.query(checkNumAPQuery, [num_ap, ftId]);
                
                if (checkResult.rows.length > 0) {
                    throw new Error(`Le numéro d'AP "${num_ap}" est déjà utilisé par un autre avis de paiement`);
                }
            }

            // Calcul du délai de paiement en jours (integer)
            let delaiPaymentDays = null;
            let effectiveDateDelaiPayment = date_delai_payment;

            if (date_delai_payment && date_ap) {
                try {
                    const dateAp = new Date(date_ap);
                    const dateDelai = new Date(date_delai_payment);
                    
                    if (!isNaN(dateAp.getTime()) && !isNaN(dateDelai.getTime())) {
                        const diffTime = dateDelai - dateAp;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 0) {
                            delaiPaymentDays = diffDays;
                        } else {
                            delaiPaymentDays = null;
                            effectiveDateDelaiPayment = null;
                        }
                    }
                } catch (dateError) {
                    console.warn('⚠️ Erreur de conversion de date pour le délai de paiement:', dateError);
                    delaiPaymentDays = null;
                    effectiveDateDelaiPayment = null;
                }
            }

            const query = `
                UPDATE avisdepaiment 
                SET 
                    num_ap = COALESCE($1, num_ap),
                    date_ap = COALESCE($2, date_ap),
                    superficie = COALESCE($3, superficie),
                    zone_geographique = COALESCE($4, zone_geographique),
                    pu_plan_urbanisme = COALESCE($5, pu_plan_urbanisme),
                    montant_chiffre = COALESCE($6, montant_chiffre),
                    montant_lettre = COALESCE($7, montant_lettre),
                    statut = COALESCE($8, statut),
                    delai_payment = $9,
                    date_delai_payment = $10,
                    titre_terrain = COALESCE($11, titre_terrain),
                    destination_terrain = COALESCE($12, destination_terrain),
                    contact = COALESCE($13, contact),
                    notes = COALESCE($14, notes),
                    update_at = CURRENT_TIMESTAMP
                WHERE id_ft = $15
                RETURNING *;
            `;

            const values = [
                num_ap || existingAP.num_ap,
                date_ap || existingAP.date_ap,
                parseFloat(superficie) || existingAP.superficie || 0,
                zone_geographique || existingAP.zone_geographique,
                pu_plan_urbanisme || existingAP.pu_plan_urbanisme,
                parseFloat(montant_chiffre) || existingAP.montant_chiffre || 0,
                montant_lettre || existingAP.montant_lettre,
                statut || existingAP.statut,
                delaiPaymentDays,
                effectiveDateDelaiPayment,
                titre_terrain || existingAP.titre_terrain,
                destination_terrain || existingAP.destination_terrain,
                contact || existingAP.contact,
                notes || existingAP.notes,
                ftId
            ];

            console.log('📝 ApModel.updateAPFromFT: Exécution de la requête UPDATE...');
            console.log('📋 Valeurs:', values);
            
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Aucun avis de paiement trouvé pour le fait-terrain ID ${ftId}`);
            }

            console.log(`✅ ApModel.updateAPFromFT: AP mis à jour avec succès, ID AP: ${result.rows[0].id}`);
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Erreur dans ApModel.updateAPFromFT:', error);
            throw new Error(`Erreur lors de la mise à jour de l'avis de paiement: ${error.message}`);
        }
    }

    static async search(criteria) {
        try {
            const { reference_ft, statut, date_debut, date_fin } = criteria;
            
            let query = `
                SELECT * FROM avisdepaiment 
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            if (reference_ft) {
                query += ` AND reference_ft ILIKE $${paramCount}`;
                values.push(`%${reference_ft}%`);
                paramCount++;
            }

            if (statut) {
                query += ` AND statut = $${paramCount}`;
                values.push(statut);
                paramCount++;
            }

            if (date_debut) {
                query += ` AND date_ft >= $${paramCount}`;
                values.push(date_debut);
                paramCount++;
            }

            if (date_fin) {
                query += ` AND date_ft <= $${paramCount}`;
                values.push(date_fin);
                paramCount++;
            }

            query += ` ORDER BY date_ft DESC, id DESC`;

            const result = await pool.query(query, values);
            
            return result.rows;
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.search:", error);
            throw new Error(`Erreur lors de la recherche des avis de paiement: ${error.message}`);
        }
    }

    static async query(sql, params = []) {
        try {
            const result = await pool.query(sql, params);
            return result;
        } catch (error) {
            console.error('❌ Erreur dans ApModel.query:', error);
            throw error;
        }
    }

    // Nouvelle méthode pour obtenir les statistiques des AP
    static async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE statut = 'fini') as fini,
                    COUNT(*) FILTER (WHERE statut = 'en attente de paiement') as attente_paiement,
                    COUNT(*) FILTER (WHERE statut = 'non comparution') as non_comparution,
                    COUNT(*) FILTER (WHERE statut = 'en cours') as en_cours,
                    COUNT(*) FILTER (WHERE date_delai_payment IS NOT NULL AND date_delai_payment <= CURRENT_DATE) as echus,
                    COALESCE(SUM(montant_chiffre), 0) as montant_total
                FROM avisdepaiment
            `;
            
            const result = await pool.query(query);
            return result.rows[0];
            
        } catch (error) {
            console.error("❌ Erreur dans ApModel.getStats:", error);
            throw new Error("Erreur lors de la récupération des statistiques des AP.");
        }
    }
    
}

export default ApModel;
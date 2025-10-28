import pool from "../config/db.js";

class ApModel {
    
    static async getAllAP() {
        try {
            const query = `
                SELECT 
                    id, 
                    id_ft_table, 
                    reference_ft, 
                    date_ft, 
                    heure_ft, 
                    infraction,
                    status_dossier,
                    statut,
                    num_ap,
                    date_ap,
                    date_descente,
                    titre_terrain,
                    superficie,
                    localite,
                    zone_geographique,
                    pu_plan_urbanisme,
                    destination_terrain,
                    montant_chiffre,
                    montant_lettre,
                    delai_payment,
                    date_delai_payment,
                    contact,
                    created_at,
                    updated_at
                FROM 
                    avisdepaiment
                ORDER BY
                    date_ft DESC, id DESC;
            `;

            const result = await pool.query(query);
            return result.rows;
            
        } catch (error) {
            console.error("Erreur dans ApModel.getAllAP:", error);
            throw new Error("Erreur lors de la récupération des avis de paiement.");
        }
    }

    static async getFTWithoutAP() {
        try {
            console.log('🔄 ApModel.getFTWithoutAP: Récupération des FT sans AP');
            
            const query = `
                SELECT 
                    id, 
                    id_ft_table, 
                    reference_ft, 
                    date_ft, 
                    heure_ft, 
                    infraction,
                    status_dossier,
                    statut,
                    created_at,
                    updated_at
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
            console.error("Erreur dans ApModel.getFTWithoutAP:", error);
            throw new Error("Erreur lors de la récupération des FT sans AP.");
        }
    }

    static async getFTById(ftId) {
        try {
            console.log(`🔄 ApModel.getFTById: Récupération du FT ID: ${ftId}`);
            
            const query = `
                SELECT 
                    id,
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
                    deadline_complement,
                    duration_complement
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
            console.error("Erreur dans ApModel.getFTById:", error);
            throw new Error(`Erreur lors de la récupération du fait-terrain: ${error.message}`);
        }
    }

    static async getFTByReference(referenceFT) {
        try {
            console.log(`🔄 ApModel.getFTByReference: Récupération du FT: ${referenceFT}`);
            
            const query = `
                SELECT 
                    id,
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
                    deadline_complement,
                    duration_complement
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
            console.error("Erreur dans ApModel.getFTByReference:", error);
            throw new Error(`Erreur lors de la récupération du fait-terrain: ${error.message}`);
        }
    }

    static async getAPByFTId(ftId) {
        try {
            console.log(`🔄 ApModel.getAPByFTId: Récupération AP pour FT ID: ${ftId}`);
            
            const query = `
                SELECT * FROM avisdepaiment 
                WHERE id_ft_table = $1
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
            console.error("Erreur dans ApModel.getAPByFTId:", error);
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
                motif,
                date_delai_payment,
                date_descente,
                num_ft,
                localite,
                coord_x,
                coord_y,
                superficie_terrain,
                nomproprietaire,
                titre_foncier,
                destination_terrain,
                valeur_unitaire,
                montant_total,
                montant_lettres,
                nom_contrevenant,
                cin_contrevenant,
                contact_contrevenant,
                adresse_contrevenant,
                id_ft_table,
                reference_ft,
                date_ft,
                heure_ft,
                infraction,
                status_dossier
            } = apData;

            if (!id_ft_table) {
                throw new Error('id_ft_table est requis');
            }

            const ft = await this.getFTById(id_ft_table);

            // ✅ CORRECTION : Gestion des deux colonnes date_delai_payment et delai_payment
            let delaiPaymentInterval = null;
            let effectiveDateDelaiPayment = date_delai_payment;

            if (date_delai_payment && date_ap) {
                try {
                    const dateAp = new Date(date_ap);
                    const dateDelai = new Date(date_delai_payment);
                    
                    if (!isNaN(dateAp.getTime()) && !isNaN(dateDelai.getTime())) {
                        const diffTime = dateDelai - dateAp;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 0) {
                            delaiPaymentInterval = `${diffDays} days`;
                        } else {
                            // Délai négatif ou nul
                            delaiPaymentInterval = null;
                            effectiveDateDelaiPayment = null;
                        }
                    }
                } catch (dateError) {
                    console.warn('⚠️ Erreur de conversion de date pour le délai de paiement:', dateError);
                    delaiPaymentInterval = null;
                    effectiveDateDelaiPayment = null;
                }
            }

            // ✅ CORRECTION : Gestion robuste des valeurs nulles pour toutes les données
            const effective = {
                // Colonnes de base
                id_ft_table: id_ft_table,
                reference_ft: reference_ft || num_ft || ft.reference_ft || '',
                date_ft: date_ft || date_descente || ft.date_ft || new Date().toISOString().split('T')[0],
                heure_ft: heure_ft || ft.heure_ft || '00:00',
                infraction: infraction || motif || ft.infraction || '',
                status_dossier: status_dossier || ft.status_dossier || '',
                statut: statut || 'fini',
                num_ap: num_ap || '',
                date_ap: date_ap || new Date().toISOString().split('T')[0],
                
                // Informations du terrain
                date_descente: date_descente || ft.date_ft || new Date().toISOString().split('T')[0],
                titre_terrain: titre_foncier || ft.titre_terrain || '',
                superficie: parseFloat(superficie) || parseFloat(superficie_terrain) || ft.superficie || 0,
                localite: localite || ft.localite || ft.localisation || '',
                zone_geographique: zone_geographique || ft.commune || ft.fokotany || '',
                pu_plan_urbanisme: pu_plan_urbanisme || '',
                destination_terrain: destination_terrain || ft.but || '',
                
                // Informations de paiement
                montant_chiffre: parseFloat(montant_chiffre) || parseFloat(montant_total) || 0,
                montant_lettre: montant_lettres || montant_lettre || '',
                delai_payment: delaiPaymentInterval,
                date_delai_payment: effectiveDateDelaiPayment
            };

            // Vérifier si une ligne existe déjà pour ce FT
            const checkQuery = `
                SELECT id, num_ap 
                FROM avisdepaiment 
                WHERE id_ft_table = $1 AND (num_ap IS NULL OR num_ap = '')
            `;
            
            const checkResult = await pool.query(checkQuery, [id_ft_table]);
            
            let result;

            if (checkResult.rows.length > 0) {
                // ✅ METTRE À JOUR la ligne existante
                console.log('📝 Mise à jour de la ligne FT existante ID:', checkResult.rows[0].id);
                
                const updateQuery = `
                    UPDATE avisdepaiment 
                    SET 
                        num_ap = $1,
                        date_ap = $2,
                        date_descente = $3,
                        titre_terrain = $4,
                        superficie = $5,
                        localite = $6,
                        zone_geographique = $7,
                        pu_plan_urbanisme = $8,
                        destination_terrain = $9,
                        montant_chiffre = $10,
                        montant_lettre = $11,
                        statut = $12,
                        infraction = $13,
                        delai_payment = $14,
                        date_delai_payment = $15,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id_ft_table = $16 AND (num_ap IS NULL OR num_ap = '')
                    RETURNING *;
                `;

                const values = [
                    effective.num_ap,
                    effective.date_ap,
                    effective.date_descente,
                    effective.titre_terrain,
                    effective.superficie,
                    effective.localite,
                    effective.zone_geographique,
                    effective.pu_plan_urbanisme,
                    effective.destination_terrain,
                    effective.montant_chiffre,
                    effective.montant_lettre,
                    effective.statut,
                    effective.infraction,
                    effective.delai_payment,
                    effective.date_delai_payment,
                    effective.id_ft_table
                ];

                console.log('📝 ApModel.create: Exécution de la requête UPDATE...');
                
                result = await pool.query(updateQuery, values);
                
            } else {
                // ✅ INSERT (cas où aucune ligne n'existe pour ce FT)
                console.log('📝 Insertion nouvelle ligne AP (aucune ligne FT trouvée)');
                
                const insertQuery = `
                    INSERT INTO avisdepaiment (
                        id_ft_table,
                        reference_ft,
                        date_ft,
                        heure_ft,
                        infraction,
                        status_dossier,
                        statut,
                        num_ap,
                        date_ap,
                        date_descente,
                        titre_terrain,
                        superficie,
                        localite,
                        zone_geographique,
                        pu_plan_urbanisme,
                        destination_terrain,
                        montant_chiffre,
                        montant_lettre,
                        delai_payment,
                        date_delai_payment,
                        created_at,
                        updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15, $16, $17, $18, $19,
                        $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                    RETURNING *;
                `;

                const values = [
                    effective.id_ft_table,
                    effective.reference_ft,
                    effective.date_ft,
                    effective.heure_ft,
                    effective.infraction,
                    effective.status_dossier,
                    effective.statut,
                    effective.num_ap,
                    effective.date_ap,
                    effective.date_descente,
                    effective.titre_terrain,
                    effective.superficie,
                    effective.localite,
                    effective.zone_geographique,
                    effective.pu_plan_urbanisme,
                    effective.destination_terrain,
                    effective.montant_chiffre,
                    effective.montant_lettre,
                    effective.delai_payment,
                    effective.date_delai_payment
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
            console.log(`🔄 ApModel.update: Mise à jour AP ID: ${id}`);
            
            const fields = [];
            const values = [];
            let paramCount = 1;

            // ✅ Seulement les champs qui existent dans votre table
            const allowedFields = [
                'id_ft_table', 'reference_ft', 'date_ft', 'heure_ft', 'infraction',
                'status_dossier', 'statut', 'num_ap', 'date_ap', 'date_descente',
                'titre_terrain', 'superficie', 'localite', 'zone_geographique',
                'pu_plan_urbanisme', 'destination_terrain', 'montant_chiffre',
                'montant_lettre', 'delai_payment', 'date_delai_payment'
            ];

            for (const [key, value] of Object.entries(apData)) {
                if (value !== undefined && key !== 'id' && allowedFields.includes(key)) {
                    // ✅ CORRECTION : Gestion robuste des dates pour date_delai_payment
                    if (key === 'date_delai_payment' && apData.date_ap) {
                        try {
                            const dateAp = new Date(apData.date_ap);
                            const dateDelai = new Date(value);
                            
                            if (!isNaN(dateAp.getTime()) && !isNaN(dateDelai.getTime())) {
                                const diffTime = dateDelai - dateAp;
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays > 0) {
                                    fields.push(`delai_payment = $${paramCount}`);
                                    values.push(`${diffDays} days`);
                                    paramCount++;
                                    
                                    fields.push(`date_delai_payment = $${paramCount}`);
                                    values.push(value);
                                    paramCount++;
                                } else {
                                    // Si le délai est négatif ou nul, mettre NULL
                                    fields.push(`delai_payment = $${paramCount}`);
                                    values.push(null);
                                    paramCount++;
                                    
                                    fields.push(`date_delai_payment = $${paramCount}`);
                                    values.push(null);
                                    paramCount++;
                                }
                            }
                        } catch (dateError) {
                            console.warn('⚠️ Erreur de conversion de date pour le délai de paiement:', dateError);
                            // Mettre NULL en cas d'erreur
                            fields.push(`delai_payment = $${paramCount}`);
                            values.push(null);
                            paramCount++;
                            
                            fields.push(`date_delai_payment = $${paramCount}`);
                            values.push(null);
                            paramCount++;
                        }
                    } else if (key !== 'date_delai_payment') {
                        // ✅ CORRECTION : Gestion des valeurs nulles pour les autres champs
                        fields.push(`${key} = $${paramCount}`);
                        values.push(value !== null ? value : null);
                        paramCount++;
                    }
                }
            }

            if (fields.length === 0) {
                throw new Error('Aucune donnée à mettre à jour');
            }

            // Mise à jour du timestamp
            fields.push('updated_at = CURRENT_TIMESTAMP');
            
            values.push(id);

            const query = `
                UPDATE avisdepaiment 
                SET ${fields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *;
            `;

            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Avis de paiement avec ID ${id} non trouvé`);
            }

            console.log(`✅ ApModel.update: AP mis à jour: ${id}`);
            return result.rows[0];
            
        } catch (error) {
            console.error('Erreur dans ApModel.update:', error);
            throw new Error(`Erreur lors de la mise à jour de l'avis de paiement: ${error.message}`);
        }
    }

    // ✅ NOUVELLE MÉTHODE : Mise à jour spécifique du statut
    static async updateAPStatut(id, updateData) {
        try {
            console.log(`🔄 ApModel.updateAPStatut: Mise à jour statut AP ID: ${id}`, updateData);
            
            const { statut, date_mise_a_jour, last_payment_date } = updateData;

            // Vérifier si l'AP existe
            const existingAP = await this.getById(id);

            // Construire la requête de mise à jour
            const fields = ['statut = $1', 'updated_at = CURRENT_TIMESTAMP'];
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

            console.log('📝 ApModel.updateAPStatut: Exécution de la requête:', query);
            console.log('📋 Valeurs:', values);

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
        
        const { statut, date_mise_a_jour, motif_non_comparution } = updateData;

        // ✅ VERSION SIMPLIFIÉE - seulement le statut
        const query = `
            UPDATE avisdepaiment 
            SET 
                statut = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;

        const values = [statut, id];

        console.log('📝 ApModel.updateStatutWithMotif: Exécution de la requête simplifiée');
        
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
                id_ft_table, 
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
        
        // Log de debug
        result.rows.forEach(ap => {
            console.log(`📋 AP ${ap.id}: ${ap.num_ap} - Échu le ${ap.date_delai_payment} (${ap.statut})`);
        });
        
        return result.rows;
        
    } catch (error) {
        console.error("❌ Erreur dans ApModel.getOverdueAPs:", error);
        throw new Error("Erreur lors de la récupération des AP échus.");
    }
}

    // ✅ NOUVELLE MÉTHODE : Vérification et mise à jour automatique des AP en retard
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
                        statut: 'non comparution',
                        date_mise_a_jour: new Date().toISOString(),
                        motif_non_comparution: 'Délai de paiement dépassé - Mise à jour automatique'
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
            console.error("Erreur dans ApModel.getById:", error);
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
            console.error("Erreur dans ApModel.delete:", error);
            throw new Error(`Erreur lors de la suppression de l'avis de paiement: ${error.message}`);
        }
    }

    // ✅ CORRECTION COMPLÈTE : Méthode updateAPFromFT avec gestion correcte de date_delai_payment
    static async updateAPFromFT(ftId, apData) {
        try {
            console.log(`🔄 ApModel.updateAPFromFT: Mise à jour AP pour FT ID: ${ftId}`);
            
            // Vérifier d'abord si l'AP existe
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
                motif,
                date_delai_payment,
                date_descente,
                titre_terrain,
                localite,
                destination_terrain,
                infraction
            } = apData;

            // ✅ CORRECTION : Vérifier si le num_ap existe déjà pour un autre AP
            if (num_ap && num_ap !== existingAP.num_ap) {
                const checkNumAPQuery = `
                    SELECT id FROM avisdepaiment 
                    WHERE num_ap = $1 AND id_ft_table != $2
                `;
                const checkResult = await pool.query(checkNumAPQuery, [num_ap, ftId]);
                
                if (checkResult.rows.length > 0) {
                    throw new Error(`Le numéro d'AP "${num_ap}" est déjà utilisé par un autre avis de paiement`);
                }
            }

            // ✅ CORRECTION : Calculer aussi le delai_payment (interval) pour compatibilité
            let delaiPaymentInterval = null;
            let effectiveDateDelaiPayment = date_delai_payment;

            if (date_delai_payment && date_ap) {
                try {
                    const dateAp = new Date(date_ap);
                    const dateDelai = new Date(date_delai_payment);
                    
                    if (!isNaN(dateAp.getTime()) && !isNaN(dateDelai.getTime())) {
                        const diffTime = dateDelai - dateAp;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 0) {
                            delaiPaymentInterval = `${diffDays} days`;
                        } else {
                            // Délai négatif ou nul
                            delaiPaymentInterval = null;
                            effectiveDateDelaiPayment = null;
                        }
                    }
                } catch (dateError) {
                    console.warn('⚠️ Erreur de conversion de date pour le délai de paiement:', dateError);
                    delaiPaymentInterval = null;
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
                    infraction = COALESCE($9, infraction),
                    delai_payment = $10,
                    date_delai_payment = $11,
                    date_descente = COALESCE($12, date_descente),
                    titre_terrain = COALESCE($13, titre_terrain),
                    localite = COALESCE($14, localite),
                    destination_terrain = COALESCE($15, destination_terrain),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_ft_table = $16
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
                motif || infraction || existingAP.infraction,
                delaiPaymentInterval,
                effectiveDateDelaiPayment,
                date_descente || existingAP.date_descente,
                titre_terrain || existingAP.titre_terrain,
                localite || existingAP.localite,
                destination_terrain || existingAP.destination_terrain,
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
            const { reference_ft, statut, date_debut, date_fin, nom_contrevenant } = criteria;
            
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
            console.error("Erreur dans ApModel.search:", error);
            throw new Error(`Erreur lors de la recherche des avis de paiement: ${error.message}`);
        }
    }
}

export default ApModel;
import ApModel from '../models/ApModel.js';

class ApController {
    
    static async getAllAP(req, res) {
        try {
            const apList = await ApModel.getAllAP();
            
            res.json({
                success: true,
                message: 'Liste des avis de paiement récupérée avec succès',
                data: apList
            });
            
        } catch (error) {
            console.error('Erreur dans ApController.getAllAP:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getFTWithoutAP(req, res) {
        try {
            console.log('🔄 ApController.getFTWithoutAP: Récupération des FT sans AP');
            
            const ftList = await ApModel.getFTWithoutAP();
            
            res.json({
                success: true,
                data: ftList,
                message: `${ftList.length} FT sans AP récupérés avec succès`
            });
            
        } catch (error) {
            console.error('❌ Erreur dans ApController.getFTWithoutAP:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getFTById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du fait-terrain requis'
                });
            }

            const parsedId = parseInt(id);
            if (isNaN(parsedId) || parsedId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du fait-terrain invalide'
                });
            }

            const ftData = await ApModel.getFTById(parsedId);
            
            res.json({
                success: true,
                message: 'Fait-terrain récupéré avec succès',
                data: ftData
            });
            
        } catch (error) {
            console.error('Erreur dans ApController.getFTById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getFTByReference(req, res) {
        try {
            const { reference } = req.params;
            
            if (!reference) {
                return res.status(400).json({
                    success: false,
                    message: 'Référence du fait-terrain requise'
                });
            }

            const ftData = await ApModel.getFTByReference(reference);
            
            res.json({
                success: true,
                message: 'Fait-terrain récupéré avec succès',
                data: ftData
            });
            
        } catch (error) {
            console.error('Erreur dans ApController.getFTByReference:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ MÉTHODE CORRIGÉE : Récupérer AP par FT ID
    static async getAPByFTId(req, res) {
        try {
            const { ftId } = req.params;
            
            console.log(`🔄 ApController.getAPByFTId: Récupération AP pour FT ID: ${ftId}`);
            
            if (!ftId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du fait-terrain requis'
                });
            }

            const parsedFtId = parseInt(ftId);
            if (isNaN(parsedFtId) || parsedFtId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du fait-terrain invalide'
                });
            }

            const apData = await ApModel.getAPByFTId(parsedFtId);
            
            res.json({
                success: true,
                message: 'Avis de paiement récupéré avec succès',
                data: apData
            });
            
        } catch (error) {
            console.error('Erreur dans ApController.getAPByFTId:', error);
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ MÉTHODE CORRIGÉE : UPDATE AP existant
    static async updateAPFromFT(req, res) {
        try {
            console.log('🔄 ApController.updateAPFromFT: Route appelée');
            console.log('📦 Body reçu:', JSON.stringify(req.body, null, 2));
            
            const { ftId } = req.params;
            const apData = req.body;
            
            if (!ftId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du fait-terrain requis dans les paramètres'
                });
            }

            const parsedFtId = parseInt(ftId);
            if (isNaN(parsedFtId) || parsedFtId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du fait-terrain invalide'
                });
            }

            // Validation des champs requis
            const requiredFields = ['num_ap', 'date_ap', 'montant_chiffre', 'statut'];
            for (const field of requiredFields) {
                if (!apData[field]) {
                    return res.status(400).json({
                        success: false,
                        message: `Le champ ${field} est requis`
                    });
                }
            }

            console.log('✅ Validation des champs passée, mise à jour de l\'AP...');
            
            // Utiliser updateAPFromFT avec ftId (pas apId)
            const updatedAP = await ApModel.updateAPFromFT(parsedFtId, apData);
            
            console.log('✅ AP mis à jour avec succès:', updatedAP.id);
            res.json({
                success: true,
                message: 'Avis de paiement mis à jour avec succès',
                data: updatedAP
            });
            
        } catch (error) {
            console.error('❌ Erreur dans ApController.updateAPFromFT:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    static async createAP(req, res) {
        try {
            console.log('🔄 ApController.createAP: Route appelée');
            console.log('📦 Body reçu:', JSON.stringify(req.body, null, 2));
            
            const apData = req.body;
            
            // Validation des champs requis
            if (!apData.num_ap) {
                return res.status(400).json({
                    success: false,
                    message: 'Numéro AP est requis'
                });
            }
            
            if (!apData.date_ap) {
                return res.status(400).json({
                    success: false,
                    message: 'Date AP est requise'
                });
            }
            
            if (!apData.id_ft_table) {
                return res.status(400).json({
                    success: false,
                    message: 'ID FT est requis'
                });
            }

            console.log('✅ Validation des champs passée, création de l\'AP...');
            
            const newAP = await ApModel.create(apData);
            
            console.log('✅ AP créé/mis à jour avec succès:', newAP.id);
            res.status(201).json({
                success: true,
                message: 'Avis de paiement créé avec succès',
                data: newAP
            });
            
        } catch (error) {
            console.error('❌ Erreur dans ApController.createAP:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    static async getAPById(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`🔄 ApController.getAPById: ID reçu: ${id}, type: ${typeof id}`);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP requis'
                });
            }

            const apId = parseInt(id);
            if (isNaN(apId) || apId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP invalide'
                });
            }

            const apData = await ApModel.getById(apId);
            
            res.json({
                success: true,
                message: 'Avis de paiement récupéré avec succès',
                data: apData
            });
            
        } catch (error) {
            console.error('Erreur dans ApController.getAPById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async updateAP(req, res) {
        try {
            const { id } = req.params;
            const apData = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP requis'
                });
            }

            const apId = parseInt(id);
            if (isNaN(apId) || apId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP invalide'
                });
            }

            const updatedAP = await ApModel.update(apId, apData);
            
            res.json({
                success: true,
                message: 'Avis de paiement mis à jour avec succès',
                data: updatedAP
            });
            
        } catch (error) {
            console.error('Erreur dans ApController.updateAP:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async deleteAP(req, res) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP requis'
                });
            }

            const apId = parseInt(id);
            if (isNaN(apId) || apId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP invalide'
                });
            }

            const deletedAP = await ApModel.delete(apId);
            
            res.json({
                success: true,
                message: 'Avis de paiement supprimé avec succès',
                data: deletedAP
            });
            
        } catch (error) {
            console.error('Erreur dans ApController.deleteAP:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async searchAP(req, res) {
        try {
            const criteria = req.query;
            
            const results = await ApModel.search(criteria);
            
            res.json({
                success: true,
                message: 'Recherche effectuée avec succès',
                data: results
            });
            
        } catch (error) {
            console.error('Erreur dans ApController.searchAP:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ NOUVELLE MÉTHODE : Mise à jour du statut d'un AP
    static async updateAPStatut(req, res) {
        try {
            const { id } = req.params;
            const { statut, date_mise_a_jour, last_payment_date } = req.body;

            console.log(`🔄 ApController.updateAPStatut: Mise à jour statut AP ID: ${id}`, { 
                statut, 
                date_mise_a_jour, 
                last_payment_date 
            });

            // Valider les données
            if (!statut) {
                return res.status(400).json({
                    success: false,
                    message: 'Le statut est requis'
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP requis'
                });
            }

            const apId = parseInt(id);
            if (isNaN(apId) || apId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP invalide'
                });
            }

            // Utiliser le modèle pour mettre à jour le statut
            const updatedAP = await ApModel.updateAPStatut(apId, {
                statut,
                date_mise_a_jour,
                last_payment_date
            });

            console.log('✅ ApController.updateAPStatut: Statut AP mis à jour avec succès:', updatedAP);

            res.json({
                success: true,
                message: `Statut de l'AP mis à jour: ${statut}`,
                data: updatedAP
            });

        } catch (error) {
            console.error('❌ Erreur dans ApController.updateAPStatut:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ NOUVELLE MÉTHODE : Mise à jour du statut avec motif
    static async updateAPStatutWithMotif(req, res) {
        try {
            const { id } = req.params;
            const { statut, date_mise_a_jour, motif_non_comparution, last_payment_date } = req.body;

            console.log(`🔄 ApController.updateAPStatutWithMotif: Mise à jour statut AP ID: ${id}`, { 
                statut, 
                date_mise_a_jour, 
                motif_non_comparution,
                last_payment_date 
            });

            // Valider les données
            if (!statut) {
                return res.status(400).json({
                    success: false,
                    message: 'Le statut est requis'
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP requis'
                });
            }

            const apId = parseInt(id);
            if (isNaN(apId) || apId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP invalide'
                });
            }

            // Utiliser le modèle pour mettre à jour le statut avec motif
            const updatedAP = await ApModel.updateStatutWithMotif(apId, {
                statut,
                date_mise_a_jour,
                motif_non_comparution,
                last_payment_date
            });

            console.log('✅ ApController.updateAPStatutWithMotif: Statut AP mis à jour avec succès:', updatedAP);

            res.json({
                success: true,
                message: `Statut de l'AP mis à jour: ${statut}`,
                data: updatedAP
            });

        } catch (error) {
            console.error('❌ Erreur dans ApController.updateAPStatutWithMotif:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ NOUVELLE MÉTHODE : Récupérer les AP en retard de paiement
    static async getOverdueAPs(req, res) {
        try {
            console.log('🔄 ApController.getOverdueAPs: Récupération des AP en retard');
            
            const overdueAPs = await ApModel.getOverdueAPs();
            
            res.json({
                success: true,
                message: `${overdueAPs.length} AP(s) en retard trouvés`,
                data: overdueAPs,
                count: overdueAPs.length
            });
            
        } catch (error) {
            console.error('❌ Erreur dans ApController.getOverdueAPs:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ NOUVELLE MÉTHODE : Vérification et mise à jour automatique des AP en retard
    static async checkAndUpdateOverdueAPs(req, res) {
        try {
            console.log('🔄 ApController.checkAndUpdateOverdueAPs: Vérification automatique des AP en retard');
            
            const results = await ApModel.checkAndUpdateOverdueAPs();
            
            console.log('✅ ApController.checkAndUpdateOverdueAPs: Vérification terminée', results);
            
            res.json({
                success: true,
                message: `Vérification automatique terminée: ${results.successfulUpdates} AP(s) mis à jour, ${results.failedUpdates} erreur(s)`,
                data: results
            });
            
        } catch (error) {
            console.error('❌ Erreur dans ApController.checkAndUpdateOverdueAPs:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ NOUVELLE MÉTHODE : Vérification manuelle des AP en retard (pour déclenchement manuel)
    static async forceCheckOverdueAPs(req, res) {
        try {
            console.log('🔄 ApController.forceCheckOverdueAPs: Vérification manuelle des AP en retard');
            
            const results = await ApModel.checkAndUpdateOverdueAPs();
            
            console.log('✅ ApController.forceCheckOverdueAPs: Vérification manuelle terminée', results);
            
            res.json({
                success: true,
                message: `Vérification manuelle terminée: ${results.successfulUpdates} AP(s) mis à jour en "non comparution", ${results.failedUpdates} erreur(s)`,
                data: results
            });
            
        } catch (error) {
            console.error('❌ Erreur dans ApController.forceCheckOverdueAPs:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ NOUVELLE MÉTHODE : Vérification du statut d'un AP spécifique
    static async checkAPStatus(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`🔄 ApController.checkAPStatus: Vérification statut AP ID: ${id}`);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP requis'
                });
            }

            const apId = parseInt(id);
            if (isNaN(apId) || apId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP invalide'
                });
            }

            const apData = await ApModel.getById(apId);
            
            // Vérifier si l'AP est en retard
            const today = new Date();
            const isOverdue = apData.date_delai_payment && 
                             new Date(apData.date_delai_payment) < today && 
                             apData.statut === 'en attente de paiement';

            const statusInfo = {
                id: apData.id,
                num_ap: apData.num_ap,
                statut: apData.statut,
                date_delai_payment: apData.date_delai_payment,
                isOverdue: isOverdue,
                shouldUpdate: isOverdue,
                newStatut: isOverdue ? 'non comparution' : null
            };

            console.log('✅ ApController.checkAPStatus: Vérification terminée', statusInfo);

            res.json({
                success: true,
                message: `Statut de l'AP vérifié`,
                data: statusInfo
            });

        } catch (error) {
            console.error('❌ Erreur dans ApController.checkAPStatus:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ✅ MÉTHODE CORRIGÉE : Mise en demeure non paiement
    static async sendMiseEnDemeure(req, res) {
        try {
            const { id } = req.params;
            const { 
                reference_ft, 
                num_ap, 
                nouveau_delai_paiement, 
                message_personnalise 
            } = req.body;

            console.log('📧 ApController.sendMiseEnDemeure: Réception mise en demeure', {
                id_ap: id,
                reference_ft,
                num_ap,
                nouveau_delai_paiement,
                message_personnalise
            });

            // Validation des données
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP requis'
                });
            }

            if (!nouveau_delai_paiement) {
                return res.status(400).json({
                    success: false,
                    message: 'Le nouveau délai de paiement est requis'
                });
            }

            const apId = parseInt(id);
            if (isNaN(apId) || apId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de l\'AP invalide'
                });
            }

            // 1. Vérifier que l'AP existe
            const apData = await ApModel.getById(apId);
            
            if (!apData) {
                return res.status(404).json({
                    success: false,
                    message: 'AP non trouvé'
                });
            }

            // 2. Enregistrer la mise en demeure (optionnel - si vous avez la table)
            try {
                const insertQuery = `
                    INSERT INTO mise_en_demeure 
                    (ap_id, reference_ft, num_ap, nouveau_delai_paiement, message_personnalise, date_envoi)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                
                await ApModel.query(insertQuery, [
                    apId,
                    reference_ft || apData.reference_ft,
                    num_ap || apData.num_ap,
                    nouveau_delai_paiement,
                    message_personnalise,
                    new Date().toISOString()
                ]);
                console.log('✅ Mise en demeure enregistrée dans la base de données');
            } catch (tableError) {
                console.log('ℹ️ Table mise_en_demeure non disponible, continuation sans enregistrement...');
            }

            // 3. Mettre à jour la date limite de paiement de l'AP avec la NOUVELLE MÉTHODE
            const updateData = {
                date_delai_payment: nouveau_delai_paiement,
                date_mise_a_jour: new Date().toISOString(),
                statut: 'attente de paiement'
            };

            // Utiliser la nouvelle méthode spécifique pour mise en demeure
            const updatedAP = await ApModel.updateMiseEnDemeure(apId, updateData);

            console.log('✅ ApController.sendMiseEnDemeure: Mise en demeure traitée avec succès pour AP:', apId);

            // 4. Ici vous pouvez ajouter l'envoi d'email
            // await sendMiseEnDemeureEmail(apData, nouveau_delai_paiement, message_personnalise);

            res.status(200).json({
                success: true,
                message: 'Mise en demeure envoyée avec succès',
                data: {
                    ap_id: apId,
                    reference_ft: reference_ft || apData.reference_ft,
                    num_ap: num_ap || apData.num_ap,
                    nouveau_delai_paiement,
                    message_personnalise,
                    date_envoi: new Date().toISOString(),
                    statut: updatedAP.statut,
                    date_delai_payment: updatedAP.date_delai_payment
                }
            });

        } catch (error) {
            console.error('❌ Erreur dans ApController.sendMiseEnDemeure:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi de la mise en demeure',
                error: error.message
            });
        }
    }
}

export default ApController;
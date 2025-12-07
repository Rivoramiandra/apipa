// models/FtModel.js
import pool from "../config/db.js";

class FtModel {
  // Créer un nouveau F.T. avec gestion cohérente des dossiers
  static async create(ftData) {
    try {
      const {
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
        status_dossier = 'En cours',
        missing_dossires = null,
        duration_complement = null,  
        deadline_complement = null,
        coord_x = null,
        coord_y = null
      } = ftData;

      // CORRECTION: Récupérer les dossiers requis depuis la descente si non fournis
      let finalMissingDossires = missing_dossires;
      if (!finalMissingDossires && id_descente) {
        finalMissingDossires = await this.getRequiredDossiersFromDescente(id_descente);
      }

      const query = `
        INSERT INTO ft_table (
          id_descente, id_rendezvous, reference_ft, date_ft, heure_ft,
          type_convoquee, nom_complet, cin, contact, adresse,
          titre_terrain, nomproprietaire, superficie,
          motif, lieu, but, mesure,
          dossier_type, num_pv, dossier,
          status_dossier, missing_dossires, duration_complement, deadline_complement,
          coord_x, coord_y
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        RETURNING *
      `;

      const values = [
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
        finalMissingDossires,
        duration_complement,
        deadline_complement,
        // CORRECTION : AJOUT DES COORDONNÉES DANS LE TABLEAU VALUES
        coord_x,
        coord_y
      ];

      console.log("📊 Création FT - Dossiers manquants initiaux:", finalMissingDossires);
      console.log("📍 Coordonnées FT:", { coord_x, coord_y });
      console.log("🔢 Nombre de paramètres dans values:", values.length);
      const result = await pool.query(query, values);
      console.log("✅ FT créé avec succès:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.create:', error);
      throw error;
    }
  }

  // Récupérer les dossiers requis depuis la descente
  static async getRequiredDossiersFromDescente(descenteId) {
    try {
      const query = `
        SELECT dossier_a_fournir, infraction, commune
        FROM descentes 
        WHERE n = $1
      `;
      const result = await pool.query(query, [descenteId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const descente = result.rows[0];
      let requiredDossiers = [];

      // Extraire les dossiers de dossier_a_fournir (tableau PostgreSQL)
      if (descente.dossier_a_fournir && descente.dossier_a_fournir.length > 0) {
        requiredDossiers = [...descente.dossier_a_fournir];
      }

      // Ajouter des dossiers basés sur l'infraction si nécessaire
      if (descente.infraction) {
        if (descente.infraction.includes('Construction')) {
          requiredDossiers.push('Permis de Construction');
        }
        if (descente.infraction.includes('Urbanisme')) {
          requiredDossiers.push('Certificat Urbanisme');
        }
      }

      console.log(`📋 Dossiers requis depuis descente ${descenteId}:`, requiredDossiers);
      return requiredDossiers.length > 0 ? requiredDossiers : null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des dossiers requis:', error);
      return null;
    }
  }

  // Récupérer tous les F.T. avec informations complètes des descentes
  static async findAll() {
    try {
      const query = `
        SELECT 
          ft.*,
          d.reference as reference_descente,
          d.commune,
          d.fokontany,
          d.localisati,
          d.infraction,
          d.nom_verbalisateur,
          d.dossier_a_fournir as dossiers_requis_descente,
          r.date_rendez_vous,
          r.heure_rendez_vous,
          r.statut as statut_rendezvous,
          r.nom_personne_r,
          -- Statut de régularisation basé sur missing_dossires
          CASE 
            WHEN ft.missing_dossires IS NULL OR array_length(ft.missing_dossires, 1) = 0 THEN 'Régularisé'
            ELSE 'Irrégularisé'
          END as statut_regularisation,
          -- Dossiers manquants calculés
          COALESCE(ft.missing_dossires, ARRAY[]::text[]) as dossiers_manquants_calcules,
          -- AJOUT DES COORDONNÉES
          ft.coord_x,
          ft.coord_y
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        LEFT JOIN rendezvous r ON ft.id_rendezvous = r.id
        ORDER BY ft.date_ft DESC, ft.id DESC
      `;
      const result = await pool.query(query);
      
      console.log(`📊 ${result.rows.length} F.T. récupérés avec informations descente`);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.findAll:', error);
      throw error;
    }
  }

  // Récupérer un F.T. par ID avec informations détaillées
  static async findById(id) {
    try {
      const query = `
        SELECT 
          ft.*,
          d.reference as reference_descente,
          d.commune,
          d.fokontany,
          d.localisati,
          d.infraction,
          d.nom_verbalisateur,
          d.dossier_a_fournir as dossiers_requis_descente,
          d.date_desce,
          d.heure_descente,
          r.date_rendez_vous,
          r.heure_rendez_vous,
          r.statut as statut_rendezvous,
          r.nom_personne_r,
          CASE 
            WHEN ft.missing_dossires IS NULL OR array_length(ft.missing_dossires, 1) = 0 THEN 'Régularisé'
            ELSE 'Irrégularisé'
          END as statut_regularisation,
          -- AJOUT DES COORDONNÉES
          ft.coord_x,
          ft.coord_y
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        LEFT JOIN rendezvous r ON ft.id_rendezvous = r.id
        WHERE ft.id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows[0]) {
        const ft = result.rows[0];
        console.log(`📊 FT ${id} - Dossiers requis: ${ft.dossiers_requis_descente}`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.findById:', error);
      throw error;
    }
  }

  // CORRECTION : Mettre à jour les dossiers manquants sans updated_at
  static async updateMissingDossiers(id, missing_dossires) {
    try {
      const isRegularise = !missing_dossires || missing_dossires.length === 0;
      const newStatus = isRegularise ? 'Complété' : 'En cours';
      
      console.log(`🔄 Mise à jour missing_dossires pour FT ${id}:`, missing_dossires);
      
      const query = `
        UPDATE ft_table 
        SET missing_dossires = $1,
            status_dossier = $2
        WHERE id = $3 
        RETURNING *
      `;
      const result = await pool.query(query, [missing_dossires, newStatus, id]);
      
      console.log(`✅ Missing_dossires mis à jour pour FT ${id}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.updateMissingDossiers:', error);
      throw error;
    }
  }

  // CORRECTION : Ajouter un dossier manquant sans updated_at
  static async addMissingDossier(id, dossier) {
    try {
      console.log(`🔄 Ajout dossier manquant pour FT ${id}:`, dossier);
      
      const currentFT = await this.findById(id);
      const currentMissing = currentFT.missing_dossires || [];
      
      // Éviter les doublons
      if (currentMissing.includes(dossier)) {
        console.log(`ℹ️ Dossier "${dossier}" déjà présent dans les manquants`);
        return currentFT;
      }
      
      const newMissing = [...currentMissing, dossier];
      
      const query = `
        UPDATE ft_table 
        SET missing_dossires = $1,
            status_dossier = 'En cours'
        WHERE id = $2 
        RETURNING *
      `;
      const result = await pool.query(query, [newMissing, id]);
      
      console.log(`✅ Dossier "${dossier}" ajouté. Total: ${newMissing.length} dossiers manquants`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.addMissingDossier:', error);
      throw error;
    }
  }

  // CORRECTION AMÉLIORÉE : Marquer un dossier comme fourni sans updated_at
  static async markDossierAsProvided(id, dossier) {
    try {
      console.log(`🔄 Marquage dossier comme fourni pour FT ${id}:`, dossier);
      
      const currentFT = await this.findById(id);
      const currentMissing = currentFT.missing_dossires || [];
      
      // Vérifier si le dossier existe dans la liste des manquants
      if (!currentMissing.includes(dossier)) {
        console.log(`ℹ️ Dossier "${dossier}" non trouvé dans les manquants`);
        return currentFT;
      }
      
      // Retirer uniquement le dossier spécifié
      const newMissing = currentMissing.filter(d => d !== dossier);
      
      // Déterminer le statut : "Complété" seulement si TOUS les dossiers sont fournis
      const isRegularise = newMissing.length === 0;
      const newStatus = isRegularise ? 'Complété' : 'En cours';
      
      const query = `
        UPDATE ft_table 
        SET missing_dossires = $1,
            status_dossier = $2
        WHERE id = $3 
        RETURNING *
      `;
      const result = await pool.query(query, [newMissing, newStatus, id]);
      
      console.log(`✅ Dossier "${dossier}" marqué comme fourni. Restants: ${newMissing.length}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.markDossierAsProvided:', error);
      throw error;
    }
  }

  // NOUVELLE MÉTHODE : Marquer plusieurs dossiers comme fournis en une seule opération
  static async markMultipleDossiersAsProvided(id, dossiers) {
    try {
      console.log(`🔄 Marquage multiple dossiers pour FT ${id}:`, dossiers);
      
      const currentFT = await this.findById(id);
      const currentMissing = currentFT.missing_dossires || [];
      
      // Retirer tous les dossiers spécifiés
      const newMissing = currentMissing.filter(d => !dossiers.includes(d));
      
      // Déterminer le statut : "Complété" seulement si TOUS les dossiers sont fournis
      const isRegularise = newMissing.length === 0;
      const newStatus = isRegularise ? 'Complété' : 'En cours';
      
      const query = `
        UPDATE ft_table 
        SET missing_dossires = $1,
            status_dossier = $2
        WHERE id = $3 
        RETURNING *
      `;
      const result = await pool.query(query, [newMissing, newStatus, id]);
      
      console.log(`✅ ${dossiers.length} dossier(s) marqué(s) comme fourni(s). Restants: ${newMissing.length}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.markMultipleDossiersAsProvided:', error);
      throw error;
    }
  }

  // CORRECTION : Synchroniser les dossiers manquants sans updated_at
  static async syncWithDescenteDossiers(id) {
    try {
      const ft = await this.findById(id);
      if (!ft.id_descente) {
        throw new Error('FT non lié à une descente');
      }
      
      const requiredDossiers = await this.getRequiredDossiersFromDescente(ft.id_descente);
      
      if (!requiredDossiers || requiredDossiers.length === 0) {
        console.log(`ℹ️ Aucun dossier requis trouvé pour la descente ${ft.id_descente}`);
        return ft;
      }
      
      const query = `
        UPDATE ft_table 
        SET missing_dossires = $1,
            status_dossier = 'En cours'
        WHERE id = $2 
        RETURNING *
      `;
      const result = await pool.query(query, [requiredDossiers, id]);
      
      console.log(`✅ FT ${id} synchronisé avec descente. Dossiers requis:`, requiredDossiers);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.syncWithDescenteDossiers:', error);
      throw error;
    }
  }

  // NOUVELLE MÉTHODE : Obtenir les dossiers requis pour un FT
  static async getRequiredDossiers(ftId) {
    try {
      const ft = await this.findById(ftId);
      if (!ft.id_descente) {
        return [];
      }
      
      const requiredDossiers = await this.getRequiredDossiersFromDescente(ft.id_descente);
      return requiredDossiers || [];
    } catch (error) {
      console.error('❌ Erreur récupération dossiers requis:', error);
      return [];
    }
  }

  // NOUVELLE MÉTHODE : Obtenir le statut de complétion par dossier
  static async getDossierCompletionStatus(ftId) {
    try {
      const ft = await this.findById(ftId);
      const requiredDossiers = await this.getRequiredDossiers(ftId);
      const missingDossiers = ft.missing_dossires || [];
      
      const status = {};
      
      // Pour chaque dossier requis, vérifier s'il est manquant
      requiredDossiers.forEach(dossier => {
        status[dossier] = !missingDossiers.includes(dossier);
      });
      
      return status;
    } catch (error) {
      console.error('❌ Erreur statut complétion dossiers:', error);
      return {};
    }
  }

  // Récupérer les statistiques avec analyse des dossiers
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status_dossier = 'En cours') as en_cours,
          COUNT(*) FILTER (WHERE status_dossier = 'Complété') as complet,
          COUNT(*) FILTER (WHERE status_dossier = 'Traité') as traite,
          COUNT(*) FILTER (WHERE status_dossier = 'Archivé') as archive,
          COUNT(*) FILTER (WHERE status_dossier = 'Annulé') as annule,
          COUNT(*) FILTER (WHERE missing_dossires IS NOT NULL AND array_length(missing_dossires, 1) > 0) as avec_dossiers_manquants,
          COUNT(*) FILTER (WHERE missing_dossires IS NULL OR array_length(missing_dossires, 1) = 0) as sans_dossiers_manquants,
          (SELECT COUNT(*) FROM ft_table WHERE missing_dossires IS NOT NULL AND 'CSJ' = ANY(missing_dossires)) as manquant_csj,
          (SELECT COUNT(*) FROM ft_table WHERE missing_dossires IS NOT NULL AND 'Permis de Construction' = ANY(missing_dossires)) as manquant_permis,
          (SELECT COUNT(*) FROM ft_table WHERE missing_dossires IS NOT NULL AND 'Plan' = ANY(missing_dossires)) as manquant_plan
        FROM ft_table
      `;
      
      const result = await pool.query(query);
      const stats = result.rows[0];
      
      const total = parseInt(stats.total) || 0;
      const en_cours = parseInt(stats.en_cours) || 0;
      const complet = parseInt(stats.complet) || 0;
      const avec_dossiers_manquants = parseInt(stats.avec_dossiers_manquants) || 0;

      const pourcentage_en_cours = total > 0 ? Math.round((en_cours / total) * 100) : 0;
      const pourcentage_complet = total > 0 ? Math.round((complet / total) * 100) : 0;
      const pourcentage_dossiers_manquants = total > 0 ? Math.round((avec_dossiers_manquants / total) * 100) : 0;

      console.log(`📊 Statistiques FT - Dossiers manquants: CSJ(${stats.manquant_csj}), Permis(${stats.manquant_permis}), Plan(${stats.manquant_plan})`);

      return {
        total,
        en_cours,
        complet,
        traite: parseInt(stats.traite) || 0,
        archive: parseInt(stats.archive) || 0,
        annule: parseInt(stats.annule) || 0,
        avec_dossiers_manquants,
        sans_dossiers_manquants: parseInt(stats.sans_dossiers_manquants) || 0,
        pourcentage_en_cours,
        pourcentage_complet,
        pourcentage_dossiers_manquants,
        dossiers_manquants_courants: {
          csj: parseInt(stats.manquant_csj) || 0,
          permis_construction: parseInt(stats.manquant_permis) || 0,
          plan: parseInt(stats.manquant_plan) || 0
        }
      };
    } catch (error) {
      console.error('❌ Erreur dans FtModel.getStats:', error);
      throw error;
    }
  }

  // Migration des données existantes pour synchroniser avec les descentes
  static async migrateAndSyncDossiers() {
    try {
      const query = `
        SELECT ft.id, ft.id_descente, ft.missing_dossires, d.dossier_a_fournir
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        WHERE ft.id_descente IS NOT NULL
      `;
      
      const result = await pool.query(query);
      let migratedCount = 0;
      
      for (const row of result.rows) {
        const { id, id_descente, missing_dossires, dossier_a_fournir } = row;
        
        if ((!missing_dossires || missing_dossires.length === 0) && 
            dossier_a_fournir && dossier_a_fournir.length > 0) {
          
          await this.updateMissingDossiers(id, dossier_a_fournir);
          migratedCount++;
          console.log(`🔄 FT ${id} migré avec dossiers:`, dossier_a_fournir);
        }
      }
      
      console.log(`✅ ${migratedCount} F.T. migrés avec les dossiers requis des descentes`);
      return { migrated: migratedCount, total: result.rows.length };
    } catch (error) {
      console.error('❌ Erreur lors de la migration des dossiers:', error);
      throw error;
    }
  }

  // Récupérer les F.T. par ID de descente
  static async findByDescenteId(descenteId) {
    try {
      const query = `
        SELECT 
          ft.*,
          d.reference as reference_descente,
          d.commune,
          d.fokontany,
          d.localisati,
          d.dossier_a_fournir as dossiers_requis_descente
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        WHERE ft.id_descente = $1 
        ORDER BY ft.id DESC
      `;
      const result = await pool.query(query, [descenteId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.findByDescenteId:', error);
      throw error;
    }
  }

  // Récupérer les F.T. par ID de rendez-vous
  static async findByRendezvousId(rendezvousId) {
    try {
      const query = `
        SELECT 
          ft.*,
          d.reference as reference_descente,
          d.commune,
          d.fokontany,
          d.localisati,
          r.date_rendez_vous,
          r.heure_rendez_vous
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        LEFT JOIN rendezvous r ON ft.id_rendezvous = r.id
        WHERE ft.id_rendezvous = $1 
        ORDER BY ft.id DESC
      `;
      const result = await pool.query(query, [rendezvousId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.findByRendezvousId:', error);
      throw error;
    }
  }

  // Vérifier si une référence FT existe déjà
  static async checkReferenceExists(reference_ft) {
    try {
      const query = 'SELECT id FROM ft_table WHERE reference_ft = $1';
      const result = await pool.query(query, [reference_ft]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.checkReferenceExists:', error);
      throw error;
    }
  }

  // Vérifier si une descente a déjà un F.T.
  static async checkDescenteHasFT(descenteId) {
    try {
      const query = 'SELECT id FROM ft_table WHERE id_descente = $1';
      const result = await pool.query(query, [descenteId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.checkDescenteHasFT:', error);
      throw error;
    }
  }

  // Vérifier si un rendez-vous a déjà un F.T.
  static async checkRendezvousHasFT(rendezvousId) {
    try {
      const query = 'SELECT id FROM ft_table WHERE id_rendezvous = $1';
      const result = await pool.query(query, [rendezvousId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.checkRendezvousHasFT:', error);
      throw error;
    }
  }

  // CORRECTION : Mettre à jour le statut sans updated_at
  static async updateStatus(id, status_dossier) {
    try {
      const query = 'UPDATE ft_table SET status_dossier = $1 WHERE id = $2 RETURNING *';
      const result = await pool.query(query, [status_dossier, id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.updateStatus:', error);
      throw error;
    }
  }

  // CORRECTION : Vider tous les dossiers manquants sans updated_at
  static async clearMissingDossiers(id) {
    try {
      const query = `
        UPDATE ft_table 
        SET missing_dossires = NULL,
            status_dossier = 'Complété'
        WHERE id = $1 
        RETURNING *
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.clearMissingDossiers:', error);
      throw error;
    }
  }

  // CORRECTION : Mettre à jour la durée et deadline du complément sans updated_at
  static async updateComplementDates(id, duration_complement, deadline_complement) {
    try {
      const query = `
        UPDATE ft_table 
        SET duration_complement = $1,
            deadline_complement = $2
        WHERE id = $3 
        RETURNING *
      `;
      const result = await pool.query(query, [duration_complement, deadline_complement, id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.updateComplementDates:', error);
      throw error;
    }
  }

  // CORRECTION : Mettre à jour un F.T. complet sans updated_at
  static async update(id, ftData) {
    try {
      const {
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
        coord_x = null,
        coord_y = null
      } = ftData;

      const query = `
        UPDATE ft_table SET
          id_rendezvous = $1,
          reference_ft = $2,
          date_ft = $3,
          heure_ft = $4,
          type_convoquee = $5,
          nom_complet = $6,
          cin = $7,
          contact = $8,
          adresse = $9,
          titre_terrain = $10,
          nomproprietaire = $11,
          superficie = $12,
          motif = $13,
          lieu = $14,
          but = $15,
          mesure = $16,
          dossier_type = $17,
          num_pv = $18,
          dossier = $19,
          status_dossier = $20,
          missing_dossires = $21,
          duration_complement = $22,
          deadline_complement = $23,
          coord_x = $24,
          coord_y = $25
        WHERE id = $26
        RETURNING *
      `;

      const values = [
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
        coord_x,
        coord_y,
        id
      ];

      console.log("📊 Exécution de la requête FT UPDATE avec valeurs:", values);
      console.log("🔢 Nombre de paramètres dans values:", values.length);
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error("FT non trouvé");
      }
      
      console.log("✅ FT mis à jour avec succès:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.update:', error);
      throw error;
    }
  }

  // Supprimer un F.T.
  static async delete(id) {
    try {
      const query = 'DELETE FROM ft_table WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur dans FtModel.delete:', error);
      throw error;
    }
  }

  // Récupérer les F.T. pour la carte géospatiale
  static async findAllForMap() {
    try {
      const query = `
        SELECT 
          ft.id,
          ft.reference_ft,
          ft.status_dossier,
          ft.date_ft,
          ft.coord_x,
          ft.coord_y,
          d.n as descente_id,
          d.reference as reference_descente,
          d.localisati,
          d.commune,
          d.infraction,
          a.id as avis_id,
          p.id as paiement_id,
          CASE 
            WHEN ft.id IS NOT NULL AND a.id IS NULL AND p.id IS NULL THEN 'jaune'
            WHEN ft.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NULL THEN 'bleu'
            WHEN ft.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NOT NULL THEN 'vert'
            ELSE 'rouge'
          END AS couleur_etape
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        LEFT JOIN avisdepaiment a ON a.id_ft = ft.id
        LEFT JOIN paiements p ON p.ap_id = a.id
        WHERE ft.coord_x IS NOT NULL AND ft.coord_y IS NOT NULL
        ORDER BY ft.id DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.findAllForMap:', error);
      throw error;
    }
  }

  // Rechercher des F.T.
  static async search(term) {
    try {
      const searchTerm = `%${term}%`;
      const query = `
        SELECT 
          ft.*,
          d.reference as reference_descente,
          d.commune,
          d.fokontany,
          d.localisati,
          r.date_rendez_vous,
          ft.coord_x,
          ft.coord_y
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        LEFT JOIN rendezvous r ON ft.id_rendezvous = r.id
        WHERE ft.reference_ft ILIKE $1
          OR ft.nom_complet ILIKE $1
          OR ft.cin ILIKE $1
          OR ft.num_pv ILIKE $1
          OR d.reference ILIKE $1
          OR d.commune ILIKE $1
        ORDER BY ft.date_ft DESC
      `;
      const result = await pool.query(query, [searchTerm]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.search:', error);
      throw error;
    }
  }

  // Récupérer les F.T. avec pagination
  static async findAllPaginated(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT 
          ft.*,
          d.reference as reference_descente,
          d.commune,
          d.fokontany,
          d.localisati,
          r.date_rendez_vous,
          r.statut as statut_rendezvous,
          ft.coord_x,
          ft.coord_y
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        LEFT JOIN rendezvous r ON ft.id_rendezvous = r.id
        ORDER BY ft.date_ft DESC, ft.id DESC
        LIMIT $1 OFFSET $2
      `;
      
      const countQuery = `SELECT COUNT(*) FROM ft_table`;
      
      const [result, countResult] = await Promise.all([
        pool.query(query, [limit, offset]),
        pool.query(countQuery)
      ]);
      
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: result.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('❌ Erreur dans FtModel.findAllPaginated:', error);
      throw error;
    }
  }

  // Récupérer les F.T. expirés (deadline dépassée)
  static async findExpired() {
    try {
      const query = `
        SELECT 
          ft.*,
          d.reference as reference_descente,
          d.commune,
          d.fokontany,
          ft.coord_x,
          ft.coord_y
        FROM ft_table ft
        LEFT JOIN descentes d ON ft.id_descente = d.n
        WHERE ft.deadline_complement < CURRENT_DATE
        AND ft.status_dossier = 'En cours'
        ORDER BY ft.deadline_complement ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erreur dans FtModel.findExpired:', error);
      throw error;
    }
  }
  static async getStatsByStatus() {
  try {
    const query = `
      SELECT 
        status_dossier as statut,
        COUNT(*) as nombre_ft,
        ROUND(
          (COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.ft_table WHERE status_dossier IS NOT NULL), 0)),
          2
        ) as pourcentage_nombre
      FROM public.ft_table
      WHERE status_dossier IS NOT NULL
      GROUP BY status_dossier
      ORDER BY nombre_ft DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('❌ Erreur dans FtModel.getStatsByStatus:', error);
    throw error;
  }
}
static async getStatsByMonthAndStatus() {
  try {
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', date_ft), 'YYYY-MM') AS mois,
        status_dossier AS statut,
        COUNT(*) AS total_ft_par_statut,
        SUM(COUNT(*)) OVER (
          PARTITION BY DATE_TRUNC('month', date_ft)
        ) AS total_ft_du_mois
      FROM public.ft_table
      WHERE status_dossier IS NOT NULL
      GROUP BY DATE_TRUNC('month', date_ft), status_dossier
      ORDER BY mois, statut;
    `;

    const result = await pool.query(query);
    return result.rows;

  } catch (error) {
    console.error('❌ Erreur dans FtModel.getStatsByMonthAndStatus:', error);
    throw error;
  }
}
static async getTotalFT() {
    try {
      const query = `
        SELECT COUNT(*) AS total_ft
        FROM public.ft_table;
      `;

      const result = await pool.query(query);
      return result.rows[0]; // { total_ft: 123 } par exemple
    } catch (error) {
      console.error('❌ Erreur dans FtModel.getTotalFT:', error);
      throw error;
    }
  }

}

export default FtModel;
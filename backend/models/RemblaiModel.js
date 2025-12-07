import pool from "../config/db.js";

class RemblaiModel {
  // Récupérer tous les remblais
  static async getAllRemblai() {
    const query = `
      SELECT 
        n,
        date_desce,
        actions,
        n_pv_pat,
        n_fifafi,
        actions_su,
        proprietai,
        commune,
        localisati AS localite,
        identifica,
        x_coord,
        y_coord,
        x_long,
        y_lat,
        superficie,
        destinatio,
        montant,
        infraction,
        suite_a_do,
        amende_reg,
        n_pv_api,
        personne_r,
        pieces_fou,
        recommanda,
        "Montant _1",
        "Montant _2",
        referenc,
        observatio,
        situation,
        situatio_1,
        geom,
        missing_dossiers,
        dossier_a_fournir,
        status_dossier,
        status_paiements  -- NOUVELLE COLONNE AJOUTÉE
      FROM public.depuisavril
      ORDER BY n ASC
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      id: row.n,
      localite: row.localite,
      commune: row.commune,
      volume: row.superficie,
      lat: row.y_coord,      // Utiliser y_coord pour la latitude
      lng: row.x_coord,      // Utiliser x_coord pour la longitude
      actions: row.actions,
      proprietaire: row.proprietai,
      destination: row.destinatio,
      montant: row.montant,
      situation: row.situation,
      status_dossier: row.status_dossier,
      status_paiements: row.status_paiements,  // NOUVELLE PROPRIÉTÉ AJOUTÉE
      missing_dossiers: row.missing_dossiers || [],
      dossier_a_fournir: row.dossier_a_fournir || [],
      // Garder les valeurs originales pour le débogage
      x_coord: row.x_coord,
      y_coord: row.y_coord,
      x_long: row.x_long,
      y_lat: row.y_lat,
      identifica: row.identifica,  // ✅ AJOUTÉ
      infraction: row.infraction,
    }));
  }

  // Récupérer un remblai par son ID
  static async getRemblaiById(id) {
    const query = `
      SELECT 
        n,
        date_desce,
        actions,
        n_pv_pat,
        n_fifafi,
        actions_su,
        proprietai,
        commune,
        localisati AS localite,
        identifica,
        x_coord,
        y_coord,
        x_long,
        y_lat,
        superficie,
        destinatio,
        montant,
        infraction,
        suite_a_do,
        amende_reg,
        n_pv_api,
        personne_r,
        pieces_fou,
        recommanda,
        "Montant _1",
        "Montant _2",
        referenc,
        observatio,
        situation,
        situatio_1,
        geom,
        missing_dossiers,
        dossier_a_fournir,
        heure_descente,
        date_rendez_vous,
        heure_rendez_vous,
        type_verbalisateur,
        nom_verbalisateur,
        nom_personne_r,
        fokontany,
        modele_pv,
        created_at,
        reference,
        contact_r,
        adresse_r,
        status_dossier,
        status_paiements  -- NOUVELLE COLONNE AJOUTÉE
      FROM public.depuisavril 
      WHERE n = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Ajouter un remblai
  static async createRemblai(remblai) {
    const {
      date_desce, actions, n_pv_pat, n_fifafi, actions_su, proprietai,
      commune, localisati, identifica, x_coord, y_coord, x_long, y_lat,
      superficie, destinatio, montant, infraction, suite_a_do, amende_reg,
      n_pv_api, personne_r, pieces_fou, recommanda, montant_1, montant_2,
      referenc, observatio, situation, situatio_1, geom,
      heure_descente, date_rendez_vous, heure_rendez_vous, type_verbalisateur,
      nom_verbalisateur, nom_personne_r, fokontany, modele_pv, reference,
      contact_r, adresse_r, dossier_a_fournir, status_dossier, status_paiements  // NOUVEAU CHAMP
    } = remblai;

    // Copier automatiquement dossier_a_fournir dans missing_dossiers à l'insertion
    const missing_dossiers = dossier_a_fournir || [];

    const result = await pool.query(
      `INSERT INTO public.depuisavril(
        date_desce, actions, n_pv_pat, n_fifafi, actions_su, proprietai,
        commune, localisati, identifica, x_coord, y_coord, x_long, y_lat,
        superficie, destinatio, montant, infraction, suite_a_do, amende_reg,
        n_pv_api, personne_r, pieces_fou, recommanda, "Montant _1", "Montant _2",
        referenc, observatio, situation, situatio_1, geom,
        heure_descente, date_rendez_vous, heure_rendez_vous, type_verbalisateur,
        nom_verbalisateur, nom_personne_r, fokontany, modele_pv, reference,
        contact_r, adresse_r, dossier_a_fournir,
        missing_dossiers, status_dossier, status_paiements  -- NOUVELLE COLONNE
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
        $39,$40,$41,$42,$43,$44,$45  -- NOUVEAU PARAMÈTRE
      ) RETURNING *`,
      [
        date_desce, actions, n_pv_pat, n_fifafi, actions_su, proprietai,
        commune, localisati, identifica, x_coord, y_coord, x_long, y_lat,
        superficie, destinatio, montant, infraction, suite_a_do, amende_reg,
        n_pv_api, personne_r, pieces_fou, recommanda, montant_1, montant_2,
        referenc, observatio, situation, situatio_1, geom,
        heure_descente, date_rendez_vous, heure_rendez_vous, type_verbalisateur,
        nom_verbalisateur, nom_personne_r, fokontany, modele_pv, reference,
        contact_r, adresse_r, dossier_a_fournir,
        missing_dossiers, status_dossier, status_paiements  // NOUVELLE VALEUR
      ]
    );
    return result.rows[0];
  }

  // Méthode pour mettre à jour les coordonnées d'un remblai
  static async updateRemblaiCoordinates(id, x_coord, y_coord) {
    const result = await pool.query(
      `UPDATE public.depuisavril 
       SET x_coord = $1, y_coord = $2 
       WHERE n = $3 
       RETURNING *`,
      [x_coord, y_coord, id]
    );
    return result.rows[0];
  }

  // Mettre à jour un remblai
  static async updateRemblai(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Si dossier_a_fournir est modifié, copier automatiquement dans missing_dossiers
    if (updates.dossier_a_fournir !== undefined) {
      updates.missing_dossiers = updates.dossier_a_fournir;
    }

    // Construire dynamiquement la requête UPDATE
    for (const [key, value] of Object.entries(updates)) {
      // Gérer les noms de colonnes avec espaces ou caractères spéciaux
      const columnName = key === 'montant_1' ? '"Montant _1"' : 
                        key === 'montant_2' ? '"Montant _2"' : 
                        key;
      
      fields.push(`${columnName} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error("Aucun champ à mettre à jour");
    }

    values.push(id);

    const query = `
      UPDATE public.depuisavril 
      SET ${fields.join(', ')} 
      WHERE n = $${paramCount} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Récupérer les missing_dossiers depuis ft_table (méthode utilitaire)
  static async getMissingDossiersFromFt(idDescente) {
    const query = `
      SELECT missing_dossiers 
      FROM public.ft_table 
      WHERE id_descente = $1
    `;

    const result = await pool.query(query, [idDescente.toString()]);
    return result.rows[0]?.missing_dossiers || [];
  }

  // Synchroniser manuellement les missing_dossiers pour un remblai
  static async syncMissingDossiers(id) {
    const query = `
      UPDATE public.depuisavril 
      SET missing_dossiers = COALESCE(
        (SELECT missing_dossiers FROM public.ft_table WHERE id_descente = $1::text),
        ARRAY[]::text[]
      )
      WHERE n = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, id]);
    return result.rows[0];
  }

  // Rechercher des remblais avec filtres
  static async searchRemblai(filters = {}) {
    let query = `
      SELECT 
        n,
        date_desce,
        actions,
        commune,
        localisati AS localite,
        proprietai,
        superficie,
        destinatio,
        situation,
        status_dossier,
        status_paiements,  -- NOUVELLE COLONNE AJOUTÉE
        missing_dossiers,
        dossier_a_fournir,
        x_coord,
        y_coord
      FROM public.depuisavril
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    // Filtre par commune
    if (filters.commune) {
      query += ` AND commune ILIKE $${paramCount}`;
      values.push(`%${filters.commune}%`);
      paramCount++;
    }

    // Filtre par situation
    if (filters.situation) {
      query += ` AND situation ILIKE $${paramCount}`;
      values.push(`%${filters.situation}%`);
      paramCount++;
    }

    // Filtre par status_dossier
    if (filters.status_dossier) {
      query += ` AND status_dossier ILIKE $${paramCount}`;
      values.push(`%${filters.status_dossier}%`);
      paramCount++;
    }

    // Filtre par status_paiements (NOUVEAU FILTRE)
    if (filters.status_paiements) {
      query += ` AND status_paiements ILIKE $${paramCount}`;
      values.push(`%${filters.status_paiements}%`);
      paramCount++;
    }

    // Filtre par missing_dossiers (non vide)
    if (filters.hasMissingDossiers) {
      query += ` AND array_length(missing_dossiers, 1) > 0`;
    }

    // Filtre par dossier_a_fournir (non vide)
    if (filters.hasDossierAFournir) {
      query += ` AND array_length(dossier_a_fournir, 1) > 0`;
    }

    // Filtre par dossiers complets (missing_dossiers vide)
    if (filters.dossiersComplets) {
      query += ` AND (missing_dossiers IS NULL OR array_length(missing_dossiers, 1) = 0)`;
    }

    // Filtre par paiements (NOUVEAU FILTRE)
    if (filters.hasPaiements) {
      query += ` AND status_paiements IS NOT NULL`;
    }

    // Filtre par date
    if (filters.date_start && filters.date_end) {
      query += ` AND date_desce BETWEEN $${paramCount} AND $${paramCount + 1}`;
      values.push(filters.date_start, filters.date_end);
      paramCount += 2;
    }

    query += ` ORDER BY n ASC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Compter les remblais par état de dossier et paiements
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN missing_dossiers IS NULL OR array_length(missing_dossiers, 1) = 0 THEN 1 END) as dossiers_complets,
        COUNT(CASE WHEN array_length(missing_dossiers, 1) > 0 THEN 1 END) as dossiers_incomplets,
        COUNT(CASE WHEN status_dossier IS NOT NULL THEN 1 END) as avec_status_dossier,
        COUNT(CASE WHEN status_dossier = 'regularise' THEN 1 END) as regularises,
        -- NOUVELLES STATISTIQUES PAIEMENTS
        COUNT(CASE WHEN status_paiements IS NOT NULL THEN 1 END) as avec_status_paiements,
        COUNT(CASE WHEN status_paiements = 'payé' THEN 1 END) as paiements_payes,
        COUNT(CASE WHEN status_paiements = 'en_attente' THEN 1 END) as paiements_en_attente,
        COUNT(CASE WHEN status_paiements = 'partiel' THEN 1 END) as paiements_partiels
      FROM public.depuisavril
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }

  // Mettre à jour seulement les missing_dossiers
  static async updateMissingDossiers(id, missingDossiers) {
    const result = await pool.query(
      `UPDATE public.depuisavril 
       SET missing_dossiers = $1 
       WHERE n = $2 
       RETURNING *`,
      [missingDossiers || [], id]
    );
    return result.rows[0];
  }

  // Mettre à jour seulement les dossier_a_fournir (et synchroniser missing_dossiers)
  static async updateDossierAFournir(id, dossierAFournir) {
    const result = await pool.query(
      `UPDATE public.depuisavril 
       SET dossier_a_fournir = $1, missing_dossiers = $1
       WHERE n = $2 
       RETURNING *`,
      [dossierAFournir || [], id]
    );
    return result.rows[0];
  }

  // Synchroniser le status_dossier depuis avisdepaiment
  static async syncStatusDossier(id) {
    const query = `
      UPDATE public.depuisavril 
      SET status_dossier = COALESCE(
        (SELECT ad.status_dossier 
         FROM public.ft_table ft 
         JOIN public.avisdepaiment ad ON ft.id = ad.id_ft_table 
         WHERE ft.id_descente = $1::text),
        'Non défini'
      )
      WHERE n = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, id]);
    return result.rows[0];
  }

  // NOUVELLE MÉTHODE : Synchroniser le status_paiements depuis paiements
  static async syncStatusPaiements(id) {
    const query = `
      UPDATE public.depuisavril 
      SET status_paiements = COALESCE(
        (SELECT p.statut 
         FROM public.ft_table ft 
         JOIN public.avisdepaiment ad ON ft.id = ad.id_ft_table 
         JOIN public.paiements p ON ad.id = p.ap_id 
         WHERE ft.id_descente = $1::text),
        'Non défini'
      )
      WHERE n = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, id]);
    return result.rows[0];
  }

  // NOUVELLE MÉTHODE : Synchroniser tous les status_paiements en masse
  static async syncAllStatusPaiements() {
    const query = `
      UPDATE public.depuisavril d
      SET status_paiements = COALESCE(
        (SELECT p.statut 
         FROM public.ft_table ft 
         JOIN public.avisdepaiment ad ON ft.id = ad.id_ft_table 
         JOIN public.paiements p ON ad.id = p.ap_id 
         WHERE ft.id_descente = d.n::text),
        'Non défini'
      )
      WHERE EXISTS (
        SELECT 1 
        FROM public.ft_table ft 
        JOIN public.avisdepaiment ad ON ft.id = ad.id_ft_table 
        JOIN public.paiements p ON ad.id = p.ap_id 
        WHERE ft.id_descente = d.n::text
      )
      RETURNING n, status_paiements
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // NOUVELLE MÉTHODE : Récupérer les détails de paiement pour un remblai
  static async getPaiementDetails(id) {
    const query = `
      SELECT 
        p.id as paiement_id,
        p.date_payment,
        p.method_payment,
        p.montant,
        p.reference_payment,
        p.payment_type,
        p.montant_total,
        p.montant_reste,
        p.nombre_tranches,
        p.montant_tranche,
        p.numero_tranche,
        p.statut,
        p.contact,
        a.num_ap,
        a.date_ap,
        ft.reference_ft
      FROM public.depuisavril d
      JOIN public.ft_table ft ON d.n::text = ft.id_descente
      JOIN public.avisdepaiment a ON ft.id = a.id_ft_table
      JOIN public.paiements p ON a.id = p.ap_id
      WHERE d.n = $1
      ORDER BY p.date_payment DESC
    `;

    const result = await pool.query(query, [id]);
    return result.rows;
  }
}

export default RemblaiModel;
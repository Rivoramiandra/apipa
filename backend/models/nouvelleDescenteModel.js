import pool from "../config/db.js";

class NouvelleDescente {
  static async create(nouvelleDescenteData) {
    const {
      date_desce,
      heure_descente,
      date_rendez_vous,
      heure_rendez_vous,
      n_pv_pat,
      n_fifafi,
      type_verbalisateur,
      nom_verbalisateur,
      personne_r,
      nom_personne_r,
      commune,
      fokontany,
      district,
      localisation,
      x_coord,
      y_coord,
      infraction,
      actions,
      modele_pv,
      reference,
      contact_r,
      adresse_r,
      dossier_a_fournir
    } = nouvelleDescenteData;

    const query = `
      INSERT INTO descentes (
        date_desce, heure_descente, date_rendez_vous, heure_rendez_vous,
        n_pv_pat, n_fifafi, type_verbalisateur, nom_verbalisateur, 
        personne_r, nom_personne_r, commune, fokontany, district, localisati, 
        x_coord, y_coord, infraction, actions, 
        modele_pv, reference,
        contact_r, adresse_r, dossier_a_fournir
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
        $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING *
    `;

    const values = [
      date_desce, heure_descente, date_rendez_vous || null, heure_rendez_vous || null,
      n_pv_pat, n_fifafi, type_verbalisateur, nom_verbalisateur,
      personne_r, nom_personne_r, commune, fokontany, district || null,
      localisation, x_coord || null, y_coord || null, infraction, actions, 
      modele_pv, reference || null,
      contact_r || null, adresse_r || null, dossier_a_fournir || []
    ];

    try {
      console.log("📊 Exécution de la requête SQL avec valeurs:", values);
      const result = await pool.query(query, values);
      console.log("✅ Insertion réussie:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("❌ Erreur SQL détaillée:", error);
      throw new Error(`Erreur lors de la création de la nouvelle descente: ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const query = `SELECT * FROM descentes ORDER BY n DESC`;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des descentes: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const query = `SELECT * FROM descentes WHERE n = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de la descente: ${error.message}`);
    }
  }

  static async findAllForMap() {
    try {
      const query = `
        SELECT 
          d.n AS descente_id,
          d.reference AS reference_descente,
          d.x_coord,
          d.y_coord,
          d.localisati,
          d.commune,
          d.district,
          d.fokontany,
          d.nom_verbalisateur,
          d.infraction,
          d.date_desce,
          d.actions,
          d.dossier_a_fournir,
          -- Relations avec autres tables
          f.id AS ft_table_id,
          f.status_dossier AS statut_ft,
          a.id AS avisdepaiment_id,
          a.statut AS statut_avis,
          p.id AS paiements_id,
          p.statut AS statut_paiement,
          -- Détermination de la couleur
          CASE 
            WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NOT NULL THEN 'vert'
            WHEN f.id IS NOT NULL AND a.id IS NOT NULL THEN 'bleu'
            WHEN f.id IS NOT NULL THEN 'jaune'
            ELSE 'rouge'
          END AS couleur_etape,
          CASE 
            WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NOT NULL THEN 'Paiement effectué'
            WHEN f.id IS NOT NULL AND a.id IS NOT NULL THEN 'Avis émis'
            WHEN f.id IS NOT NULL THEN 'FT créé'
            ELSE 'Non traité'
          END AS statut_texte
        FROM descentes d
        LEFT JOIN ft_table f ON f.id_descente = d.n
        LEFT JOIN avisdepaiment a ON a.id_ft = f.id
        LEFT JOIN paiements p ON p.ap_id = a.id
        WHERE d.x_coord IS NOT NULL AND d.y_coord IS NOT NULL
        ORDER BY d.n DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des données pour la carte:", error);
      throw new Error(`Erreur lors de la récupération des données cartographiques: ${error.message}`);
    }
  }

  static async findCompleteById(id) {
    try {
      const query = `
        SELECT 
          d.n AS descente_id,
          d.reference AS reference_descente,
          d.date_desce,
          d.heure_descente,
          d.nom_verbalisateur,
          d.commune,
          d.district,
          d.fokontany,
          d.localisati,
          d.x_coord,
          d.y_coord,
          d.infraction,
          d.actions,
          d.dossier_a_fournir,
          f.id AS ft_id,
          f.reference_ft,
          f.nom_complet AS nom_convoque,
          f.contact AS contact_ft,
          f.status_dossier AS statut_ft,
          a.id AS avis_id,
          a.num_ap,
          a.montant_chiffre,
          a.statut AS statut_avis,
          p.id AS paiement_id,
          p.montant AS montant_paye,
          p.statut AS statut_paiement,
          CASE 
            WHEN f.id IS NULL AND a.id IS NULL AND p.id IS NULL THEN 'rouge'
            WHEN f.id IS NOT NULL AND a.id IS NULL AND p.id IS NULL THEN 'jaune'
            WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NULL THEN 'bleu'
            WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NOT NULL THEN 'vert'
            ELSE 'gris'
          END AS couleur_etape
        FROM descentes d
        LEFT JOIN ft_table f ON f.id_descente = d.n
        LEFT JOIN avisdepaiment a ON a.id_ft = f.id
        LEFT JOIN paiements p ON p.ap_id = a.id
        WHERE d.n = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des détails complets: ${error.message}`);
    }
  }

  static async update(n, updateData) {
    const {
      date_desce,
      heure_descente,
      date_rendez_vous,
      heure_rendez_vous,
      n_pv_pat,
      n_fifafi,
      type_verbalisateur,
      nom_verbalisateur,
      personne_r,
      nom_personne_r,
      commune,
      fokontany,
      district,
      localisation,
      x_coord,
      y_coord,
      infraction,
      actions,
      modele_pv,
      reference,
      contact_r,
      adresse_r,
      dossier_a_fournir
    } = updateData;

    const query = `
      UPDATE descentes SET
        date_desce = $1,
        heure_descente = $2,
        date_rendez_vous = $3,
        heure_rendez_vous = $4,
        n_pv_pat = $5,
        n_fifafi = $6,
        type_verbalisateur = $7,
        nom_verbalisateur = $8,
        personne_r = $9,
        nom_personne_r = $10,
        commune = $11,
        fokontany = $12,
        district = $13,
        localisati = $14,
        x_coord = $15,
        y_coord = $16,
        infraction = $17,
        actions = $18,
        modele_pv = $19,
        reference = $20,
        contact_r = $21,
        adresse_r = $22,
        dossier_a_fournir = $23
      WHERE n = $24
      RETURNING *
    `;

    const values = [
      date_desce, heure_descente, date_rendez_vous || null, heure_rendez_vous || null,
      n_pv_pat, n_fifafi, type_verbalisateur, nom_verbalisateur,
      personne_r, nom_personne_r, commune, fokontany, district || null,
      localisation, x_coord || null, y_coord || null, infraction, actions, 
      modele_pv, reference || null,
      contact_r || null, adresse_r || null, dossier_a_fournir || [],
      n
    ];

    try {
      console.log("📊 Exécution de la requête UPDATE avec valeurs:", values);
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error("Descente non trouvée");
      }
      
      console.log("✅ Mise à jour réussie:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("❌ Erreur SQL détaillée:", error);
      throw new Error(`Erreur lors de la mise à jour de la descente: ${error.message}`);
    }
  }

  static async delete(n) {
    try {
      const query = `DELETE FROM descentes WHERE n = $1 RETURNING *`;
      const result = await pool.query(query, [n]);
      
      if (result.rows.length === 0) {
        throw new Error("Descente non trouvée");
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("❌ Erreur SQL détaillée:", error);
      throw new Error(`Erreur lors de la suppression de la descente: ${error.message}`);
    }
  }

  static async searchFokontany(searchTerm) {
    try {
      const query = `
        SELECT DISTINCT 
          fkt as fokontany,
          firaisana as commune,
          distrika as district
        FROM fokontany 
        WHERE 
          fkt ILIKE $1 OR 
          firaisana ILIKE $1 OR 
          distrika ILIKE $1
        ORDER BY fkt
        LIMIT 50
      `;
      
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error("❌ Erreur lors de la recherche fokontany:", error);
      throw new Error(`Erreur lors de la recherche: ${error.message}`);
    }
  }

  static async getFokontanyByCommune(commune) {
    try {
      const query = `
        SELECT DISTINCT fkt as fokontany
        FROM fokontany 
        WHERE firaisana = $1
        ORDER BY fkt
      `;
      
      const result = await pool.query(query, [commune]);
      return result.rows.map(row => row.fokontany);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des fokontany:", error);
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }
  }

  static async getCommunesByDistrict(district) {
    try {
      const query = `
        SELECT DISTINCT firaisana as commune
        FROM fokontany 
        WHERE distrika = $1
        ORDER BY firaisana
      `;
      
      const result = await pool.query(query, [district]);
      return result.rows.map(row => row.commune);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des communes:", error);
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }
  }

  static async getAutoCompleteData(field, value) {
    try {
      let query, params;
      
      switch (field) {
        case 'fokontany':
          query = `
            SELECT DISTINCT fkt as fokontany, firaisana as commune, distrika as district
            FROM fokontany 
            WHERE fkt ILIKE $1
            LIMIT 1
          `;
          params = [`%${value}%`];
          break;
          
        case 'commune':
          query = `
            SELECT DISTINCT firaisana as commune, distrika as district
            FROM fokontany 
            WHERE firaisana ILIKE $1
            LIMIT 1
          `;
          params = [`%${value}%`];
          break;
          
        case 'district':
          query = `
            SELECT DISTINCT distrika as district
            FROM fokontany 
            WHERE distrika ILIKE $1
            LIMIT 1
          `;
          params = [`%${value}%`];
          break;
          
        default:
          return null;
      }
      
      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error("❌ Erreur lors de l'auto-complétion:", error);
      throw new Error(`Erreur lors de l'auto-complétion: ${error.message}`);
    }
  }

  static async getAllDistricts() {
    try {
      const query = `SELECT DISTINCT distrika as district FROM fokontany ORDER BY distrika`;
      const result = await pool.query(query);
      return result.rows.map(row => row.district);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des districts:", error);
      throw new Error(`Erreur lors de la récupération des districts: ${error.message}`);
    }
  }

  static async getAllCommunes() {
    try {
      const query = `SELECT DISTINCT firaisana as commune FROM fokontany ORDER BY firaisana`;
      const result = await pool.query(query);
      return result.rows.map(row => row.commune);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des communes:", error);
      throw new Error(`Erreur lors de la récupération des communes: ${error.message}`);
    }
  }
  static async getDescentesParMois(annee = null) {
  try {
    // Si aucune année n'est spécifiée, on prend l'année courante
    const anneeRecherche = annee || new Date().getFullYear();
    
    const query = `
      SELECT 
        TO_CHAR(date_desce, 'YYYY-MM') as mois,
        TO_CHAR(date_desce, 'Mon') as mois_court,
        TO_CHAR(date_desce, 'Month') as mois_complet,
        EXTRACT(YEAR FROM date_desce) as annee,
        COUNT(*) as nombre_descentes,
        -- Statistiques par statut
        COUNT(CASE WHEN f.id IS NULL THEN 1 END) as non_traitees,
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NULL THEN 1 END) as en_attente_avis,
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NULL THEN 1 END) as en_attente_paiement,
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NOT NULL THEN 1 END) as completees
      FROM descentes d
      LEFT JOIN ft_table f ON f.id_descente = d.n
      LEFT JOIN avisdepaiment a ON a.id_ft = f.id
      LEFT JOIN paiements p ON p.ap_id = a.id
      WHERE EXTRACT(YEAR FROM date_desce) = $1
        AND date_desce IS NOT NULL
      GROUP BY 
        TO_CHAR(date_desce, 'YYYY-MM'),
        TO_CHAR(date_desce, 'Mon'),
        TO_CHAR(date_desce, 'Month'),
        EXTRACT(YEAR FROM date_desce)
      ORDER BY mois
    `;
    
    const result = await pool.query(query, [anneeRecherche]);
    
    // Formater les résultats pour avoir tous les mois de l'année
    const moisComplets = this.genererMoisComplets(anneeRecherche, result.rows);
    
    return moisComplets;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des descentes par mois:", error);
    throw new Error(`Erreur lors de la récupération des statistiques mensuelles: ${error.message}`);
  }
}

// Méthode utilitaire pour générer tous les mois de l'année avec les données
static genererMoisComplets(annee, donneesMois) {
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

  // Créer un map des données existantes pour un accès rapide
  const donneesMap = new Map();
  donneesMois.forEach(donnee => {
    const moisNumero = donnee.mois.split('-')[1];
    donneesMap.set(moisNumero, donnee);
  });

  // Générer tous les mois de l'année
  return mois.map(moisInfo => {
    const moisKey = `${annee}-${moisInfo.numero}`;
    const donneesExistantes = donneesMap.get(moisInfo.numero);
    
    if (donneesExistantes) {
      return {
        mois: moisKey,
        mois_court: moisInfo.court,
        mois_complet: moisInfo.complet,
        annee: annee,
        nombre_descentes: parseInt(donneesExistantes.nombre_descentes) || 0,
        non_traitees: parseInt(donneesExistantes.non_traitees) || 0,
        en_attente_avis: parseInt(donneesExistantes.en_attente_avis) || 0,
        en_attente_paiement: parseInt(donneesExistantes.en_attente_paiement) || 0,
        completees: parseInt(donneesExistantes.completees) || 0
      };
    } else {
      // Mois sans données
      return {
        mois: moisKey,
        mois_court: moisInfo.court,
        mois_complet: moisInfo.complet,
        annee: annee,
        nombre_descentes: 0,
        non_traitees: 0,
        en_attente_avis: 0,
        en_attente_paiement: 0,
        completees: 0
      };
    }
  });
}

// Fonction pour récupérer les années disponibles avec des données
static async getAnneesDisponibles() {
  try {
    const query = `
      SELECT DISTINCT EXTRACT(YEAR FROM date_desce) as annee
      FROM descentes 
      WHERE date_desce IS NOT NULL
      ORDER BY annee DESC
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => parseInt(row.annee));
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des années:", error);
    throw new Error(`Erreur lors de la récupération des années: ${error.message}`);
  }
}

// Fonction pour récupérer les statistiques globales par année
static async getStatistiquesGlobales(annee = null) {
  try {
    const anneeRecherche = annee || new Date().getFullYear();
    
    const query = `
      SELECT 
        EXTRACT(YEAR FROM date_desce) as annee,
        COUNT(*) as total_descentes,
        COUNT(CASE WHEN f.id IS NOT NULL THEN 1 END) as ft_etablis,
        COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as avis_emis,
        COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as paiements_complets,
        -- Calcul des pourcentages
        ROUND(
          (COUNT(CASE WHEN f.id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
          1
        ) as pourcentage_ft,
        ROUND(
          (COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
          1
        ) as pourcentage_avis,
        ROUND(
          (COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
          1
        ) as pourcentage_paiement
      FROM descentes d
      LEFT JOIN ft_table f ON f.id_descente = d.n
      LEFT JOIN avisdepaiment a ON a.id_ft = f.id
      LEFT JOIN paiements p ON p.ap_id = a.id
      WHERE EXTRACT(YEAR FROM date_desce) = $1
        AND date_desce IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM date_desce)
    `;
    
    const result = await pool.query(query, [anneeRecherche]);
    
    if (result.rows.length === 0) {
      return {
        annee: anneeRecherche,
        total_descentes: 0,
        ft_etablis: 0,
        avis_emis: 0,
        paiements_complets: 0,
        pourcentage_ft: 0,
        pourcentage_avis: 0,
        pourcentage_paiement: 0
      };
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques globales:", error);
    throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
  }
}
static async getStatistiquesParEtape(annee = null) {
  try {
    const anneeRecherche = annee || new Date().getFullYear();
    
    const query = `
      SELECT 
        -- En attente FT (descentes sans FT)
        COUNT(CASE WHEN f.id IS NULL THEN 1 END) as en_attente_ft,
        
        -- En attente AP (descentes avec FT mais sans avis)
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NULL THEN 1 END) as en_attente_ap,
        
        -- En attente paiement (descentes avec FT et avis mais sans paiement)
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NULL THEN 1 END) as en_attente_paiement,
        
        -- Finalisés (descentes avec FT, avis et paiement)
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NOT NULL THEN 1 END) as finalises,
        
        -- Total des descentes
        COUNT(*) as total_descentes
        
      FROM descentes d
      LEFT JOIN ft_table f ON f.id_descente = d.n
      LEFT JOIN avisdepaiment a ON a.id_ft = f.id
      LEFT JOIN paiements p ON p.ap_id = a.id
      WHERE EXTRACT(YEAR FROM date_desce) = $1
        AND date_desce IS NOT NULL
    `;
    
    const result = await pool.query(query, [anneeRecherche]);
    
    if (result.rows.length === 0) {
      return {
        en_attente_ft: 0,
        en_attente_ap: 0,
        en_attente_paiement: 0,
        finalises: 0,
        total_descentes: 0
      };
    }
    
    const stats = result.rows[0];
    
    // Retourner les statistiques formatées
    return {
      en_attente_ft: parseInt(stats.en_attente_ft) || 0,
      en_attente_ap: parseInt(stats.en_attente_ap) || 0,
      en_attente_paiement: parseInt(stats.en_attente_paiement) || 0,
      finalises: parseInt(stats.finalises) || 0,
      total_descentes: parseInt(stats.total_descentes) || 0
    };
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques par étape:", error);
    throw new Error(`Erreur lors de la récupération des statistiques par étape: ${error.message}`);
  }
}

// Fonction pour récupérer les statistiques par étape avec pourcentages
static async getStatistiquesParEtapeAvecPourcentages(annee = null) {
  try {
    const stats = await this.getStatistiquesParEtape(annee);
    
    const total = stats.total_descentes;
    
    // Calculer les pourcentages
    const statsAvecPourcentages = {
      ...stats,
      pourcentage_attente_ft: total > 0 ? ((stats.en_attente_ft / total) * 100).toFixed(1) : '0.0',
      pourcentage_attente_ap: total > 0 ? ((stats.en_attente_ap / total) * 100).toFixed(1) : '0.0',
      pourcentage_attente_paiement: total > 0 ? ((stats.en_attente_paiement / total) * 100).toFixed(1) : '0.0',
      pourcentage_finalises: total > 0 ? ((stats.finalises / total) * 100).toFixed(1) : '0.0'
    };
    
    return statsAvecPourcentages;
    
  } catch (error) {
    console.error("❌ Erreur lors du calcul des pourcentages:", error);
    throw new Error(`Erreur lors du calcul des pourcentages: ${error.message}`);
  }
}

// Fonction pour récupérer les statistiques par étape par mois
static async getStatistiquesParEtapeParMois(annee = null) {
  try {
    const anneeRecherche = annee || new Date().getFullYear();
    
    const query = `
      SELECT 
        TO_CHAR(date_desce, 'YYYY-MM') as mois,
        TO_CHAR(date_desce, 'Mon') as mois_court,
        TO_CHAR(date_desce, 'Month') as mois_complet,
        EXTRACT(YEAR FROM date_desce) as annee,
        
        -- En attente FT (descentes sans FT)
        COUNT(CASE WHEN f.id IS NULL THEN 1 END) as en_attente_ft,
        
        -- En attente AP (descentes avec FT mais sans avis)
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NULL THEN 1 END) as en_attente_ap,
        
        -- En attente paiement (descentes avec FT et avis mais sans paiement)
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NULL THEN 1 END) as en_attente_paiement,
        
        -- Finalisés (descentes avec FT, avis et paiement)
        COUNT(CASE WHEN f.id IS NOT NULL AND a.id IS NOT NULL AND p.id IS NOT NULL THEN 1 END) as finalises,
        
        -- Total des descentes
        COUNT(*) as total_descentes
        
      FROM descentes d
      LEFT JOIN ft_table f ON f.id_descente = d.n
      LEFT JOIN avisdepaiment a ON a.id_ft = f.id
      LEFT JOIN paiements p ON p.ap_id = a.id
      WHERE EXTRACT(YEAR FROM date_desce) = $1
        AND date_desce IS NOT NULL
      GROUP BY 
        TO_CHAR(date_desce, 'YYYY-MM'),
        TO_CHAR(date_desce, 'Mon'),
        TO_CHAR(date_desce, 'Month'),
        EXTRACT(YEAR FROM date_desce)
      ORDER BY mois
    `;
    
    const result = await pool.query(query, [anneeRecherche]);
    
    // Formater les résultats pour avoir tous les mois de l'année
    const moisComplets = this.genererMoisCompletsAvecEtapes(anneeRecherche, result.rows);
    
    return moisComplets;
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques par étape par mois:", error);
    throw new Error(`Erreur lors de la récupération des statistiques par étape par mois: ${error.message}`);
  }
}

// Méthode utilitaire pour générer tous les mois de l'année avec les données par étape
static genererMoisCompletsAvecEtapes(annee, donneesMois) {
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

  // Créer un map des données existantes pour un accès rapide
  const donneesMap = new Map();
  donneesMois.forEach(donnee => {
    const moisNumero = donnee.mois.split('-')[1];
    donneesMap.set(moisNumero, donnee);
  });

  // Générer tous les mois de l'année
  return mois.map(moisInfo => {
    const moisKey = `${annee}-${moisInfo.numero}`;
    const donneesExistantes = donneesMap.get(moisInfo.numero);
    
    if (donneesExistantes) {
      return {
        mois: moisKey,
        mois_court: moisInfo.court,
        mois_complet: moisInfo.complet,
        annee: annee,
        en_attente_ft: parseInt(donneesExistantes.en_attente_ft) || 0,
        en_attente_ap: parseInt(donneesExistantes.en_attente_ap) || 0,
        en_attente_paiement: parseInt(donneesExistantes.en_attente_paiement) || 0,
        finalises: parseInt(donneesExistantes.finalises) || 0,
        total_descentes: parseInt(donneesExistantes.total_descentes) || 0
      };
    } else {
      // Mois sans données
      return {
        mois: moisKey,
        mois_court: moisInfo.court,
        mois_complet: moisInfo.complet,
        annee: annee,
        en_attente_ft: 0,
        en_attente_ap: 0,
        en_attente_paiement: 0,
        finalises: 0,
        total_descentes: 0
      };
    }
  });
}
}

export default NouvelleDescente;
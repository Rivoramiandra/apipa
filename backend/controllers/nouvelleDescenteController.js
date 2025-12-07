import NouvelleDescente from "../models/nouvelleDescenteModel.js";

export default class NouvelleDescenteController {
  // ✅ Créer une nouvelle descente
  static async create(req, res) {
    try {
      console.log("📝 Données reçues pour nouvelle descente:", req.body);

      // Validation des données requises
      const requiredFields = [
        'dateDescente', 'heureDescente', 'numeroPV', 'typeVerbalisateur', 
        'nomVerbalisateur', 'personneR', 'nomPersonneR', 'commune', 
        'fokontany', 'localite', 'infraction'
      ];

      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Le champ ${field} est obligatoire`
          });
        }
      }

      const descenteData = {
        date_desce: req.body.dateDescente,
        heure_descente: req.body.heureDescente,
        date_rendez_vous: req.body.dateRendezVous || null,
        heure_rendez_vous: req.body.heureRendezVous || null,
        n_pv_pat: req.body.modelePV === 'PAT' ? req.body.numeroPV : null,
        n_fifafi: req.body.modelePV === 'FIFAFI' ? req.body.numeroPV : null,
        type_verbalisateur: req.body.typeVerbalisateur,
        nom_verbalisateur: req.body.nomVerbalisateur,
        personne_r: req.body.personneR,
        nom_personne_r: req.body.nomPersonneR,
        commune: req.body.commune,
        fokontany: req.body.fokontany,
        district: req.body.district || null, // Nouvelle colonne district
        localisation: req.body.localite,
        x_coord: req.body.X_coord || null,
        y_coord: req.body.Y_coord || null,
        infraction: req.body.infraction,
        actions: req.body.actions ? req.body.actions.join(', ') : '',
        modele_pv: req.body.modelePV || 'PAT',
        reference: req.body.reference,
        contact_r: req.body.contactR || null,
        adresse_r: req.body.adresseR || null,
        dossier_a_fournir: req.body.dossierAFournir || []
      };

      console.log("💾 Données mappées pour insertion:", descenteData);

      // Insertion dans la base de données
      const nouvelleDescente = await NouvelleDescente.create(descenteData);

      console.log("✅ Descente créée avec succès:", nouvelleDescente);

      res.status(201).json({
        success: true,
        message: "Descente créée avec succès",
        data: nouvelleDescente
      });

    } catch (error) {
      console.error("❌ Erreur lors de la création de la descente:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création de la descente",
        error: error.message
      });
    }
  }

  // ✅ Récupérer toutes les descentes
  static async getAll(req, res) {
    try {
      const descentes = await NouvelleDescente.findAll();

      res.json({
        success: true,
        data: descentes
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des descentes:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des descentes",
        error: error.message
      });
    }
  }

  // ✅ Récupérer toutes les descentes pour la carte géospatiale
  static async getAllForMap(req, res) {
    try {
      console.log("🗺️ Récupération des données pour la carte...");
      
      const descentes = await NouvelleDescente.findAllForMap();

      console.log(`📍 ${descentes.length} descentes trouvées pour la carte`);

      // Formater les données pour la carte
      const donneesCarte = descentes.map(descente => ({
        id: descente.descente_id,
        reference: descente.reference_descente,
        lat: descente.y_coord,
        lng: descente.x_coord,
        localisation: descente.localisati,
        commune: descente.commune,
        district: descente.district, // Inclure le district
        verbalisateur: descente.nom_verbalisateur,
        infraction: descente.infraction,
        date_descente: descente.date_desce,
        couleur: descente.couleur_etape,
        statut: descente.statut_texte,
        details: {
          ft_id: descente.ft_table_id,
          avis_id: descente.avisdepaiment_id,
          paiement_id: descente.paiements_id
        }
      }));

      res.json({
        success: true,
        data: donneesCarte,
        total: donneesCarte.length,
        statistiques: {
          rouge: donneesCarte.filter(d => d.couleur === 'rouge').length,
          jaune: donneesCarte.filter(d => d.couleur === 'jaune').length,
          bleu: donneesCarte.filter(d => d.couleur === 'bleu').length,
          vert: donneesCarte.filter(d => d.couleur === 'vert').length
        }
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des données pour la carte:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des données cartographiques",
        error: error.message
      });
    }
  }

  // ✅ Récupérer les détails complets d'une descente avec ses relations
  static async getCompleteById(req, res) {
    try {
      const { id } = req.params;
      console.log("📋 Récupération des détails complets pour la descente ID:", id);

      const descente = await NouvelleDescente.findCompleteById(id);

      if (!descente) {
        return res.status(404).json({
          success: false,
          message: "Descente non trouvée"
        });
      }

      console.log("✅ Détails complets récupérés avec succès");

      res.json({
        success: true,
        data: descente
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des détails complets:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des détails de la descente",
        error: error.message
      });
    }
  }

  // ✅ Mettre à jour une descente
  static async update(req, res) {
    try {
      const { id } = req.params;
      console.log("📝 Mise à jour de la descente ID:", id);
      console.log("📝 Données reçues:", req.body);

      // Vérifier si la descente existe
      const existingDescente = await NouvelleDescente.findById(id);
      if (!existingDescente) {
        return res.status(404).json({
          success: false,
          message: "Descente non trouvée"
        });
      }

      // Validation des données requises
      const requiredFields = [
        'dateDescente', 'heureDescente', 'numeroPV', 'typeVerbalisateur', 
        'nomVerbalisateur', 'personneR', 'nomPersonneR', 'commune', 
        'fokontany', 'localite', 'infraction'
      ];

      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Le champ ${field} est obligatoire`
          });
        }
      }

      const descenteData = {
        date_desce: req.body.dateDescente,
        heure_descente: req.body.heureDescente,
        date_rendez_vous: req.body.dateRendezVous || null,
        heure_rendez_vous: req.body.heureRendezVous || null,
        n_pv_pat: req.body.modelePV === 'PAT' ? req.body.numeroPV : null,
        n_fifafi: req.body.modelePV === 'FIFAFI' ? req.body.numeroPV : null,
        type_verbalisateur: req.body.typeVerbalisateur,
        nom_verbalisateur: req.body.nomVerbalisateur,
        personne_r: req.body.personneR,
        nom_personne_r: req.body.nomPersonneR,
        commune: req.body.commune,
        fokontany: req.body.fokontany,
        district: req.body.district || null, // Nouvelle colonne district
        localisation: req.body.localite,
        x_coord: req.body.X_coord || null,
        y_coord: req.body.Y_coord || null,
        infraction: req.body.infraction,
        actions: req.body.actions ? req.body.actions.join(', ') : '',
        modele_pv: req.body.modelePV || 'PAT',
        reference: req.body.reference,
        contact_r: req.body.contactR || null,
        adresse_r: req.body.adresseR || null,
        dossier_a_fournir: req.body.dossierAFournir || []
      };

      // Mettre à jour dans la base de données
      const updatedDescente = await NouvelleDescente.update(id, descenteData);

      console.log("✅ Descente mise à jour avec succès:", updatedDescente);

      res.json({
        success: true,
        message: "Descente mise à jour avec succès",
        data: updatedDescente
      });

    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour de la descente:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de la descente",
        error: error.message
      });
    }
  }

  // ✅ Supprimer une descente
  static async delete(req, res) {
    try {
      const { id } = req.params;
      console.log("🗑️ Suppression de la descente ID:", id);

      // Vérifier si la descente existe
      const existingDescente = await NouvelleDescente.findById(id);
      if (!existingDescente) {
        return res.status(404).json({
            success: false,
            message: "Descente non trouvée"
        });
      }

      // Supprimer de la base de données
      await NouvelleDescente.delete(id);

      console.log("✅ Descente supprimée avec succès");

      res.json({
        success: true,
        message: "Descente supprimée avec succès"
      });

    } catch (error) {
      console.error("❌ Erreur lors de la suppression de la descente:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de la descente",
        error: error.message
      });
    }
  }

  // ✅ Récupérer une descente par ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const descente = await NouvelleDescente.findById(id);

      if (!descente) {
        return res.status(404).json({
          success: false,
          message: "Descente non trouvée"
        });
      }

      res.json({
        success: true,
        data: descente
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération de la descente:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération de la descente",
        error: error.message
      });
    }
  }

  // ✅ Récupérer les statistiques des descentes
  static async getStats(req, res) {
    try {
      const descentes = await NouvelleDescente.findAllForMap();
      
      const stats = {
        total: descentes.length,
        par_couleur: {
          rouge: descentes.filter(d => d.couleur_etape === 'rouge').length,
          jaune: descentes.filter(d => d.couleur_etape === 'jaune').length,
          bleu: descentes.filter(d => d.couleur_etape === 'bleu').length,
          vert: descentes.filter(d => d.couleur_etape === 'vert').length
        },
        par_commune: {},
        par_district: {}, // Nouvelles statistiques par district
        par_statut: {}
      };

      // Statistiques par commune
      descentes.forEach(descente => {
        const commune = descente.commune || 'Non spécifié';
        stats.par_commune[commune] = (stats.par_commune[commune] || 0) + 1;
      });

      // Statistiques par district
      descentes.forEach(descente => {
        const district = descente.district || 'Non spécifié';
        stats.par_district[district] = (stats.par_district[district] || 0) + 1;
      });

      // Statistiques par statut
      descentes.forEach(descente => {
        const statut = descente.statut_texte;
        stats.par_statut[statut] = (stats.par_statut[statut] || 0) + 1;
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des statistiques:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des statistiques",
        error: error.message
      });
    }
  }

  // ✅ Recherche de fokontany
  static async searchFokontany(req, res) {
    try {
      const { search } = req.query;
      
      if (!search) {
        return res.status(400).json({
          success: false,
          message: "Le terme de recherche est requis"
        });
      }

      const results = await NouvelleDescente.searchFokontany(search);

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error("❌ Erreur lors de la recherche fokontany:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la recherche",
        error: error.message
      });
    }
  }

  // ✅ Récupérer les fokontany par commune
  static async getFokontanyByCommune(req, res) {
    try {
      const { commune } = req.params;
      
      const fokontany = await NouvelleDescente.getFokontanyByCommune(commune);

      res.json({
        success: true,
        data: fokontany
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des fokontany:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des fokontany",
        error: error.message
      });
    }
  }

  // ✅ Récupérer les communes par district
  static async getCommunesByDistrict(req, res) {
    try {
      const { district } = req.params;
      
      const communes = await NouvelleDescente.getCommunesByDistrict(district);

      res.json({
        success: true,
        data: communes
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des communes:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des communes",
        error: error.message
      });
    }
  }

  // ✅ Auto-complétion pour les formulaires
  static async autoCompleteForm(req, res) {
    try {
      const { field, value } = req.query;
      
      if (!field || !value) {
        return res.status(400).json({
          success: false,
          message: "Les paramètres field et value sont requis"
        });
      }

      const result = await NouvelleDescente.getAutoCompleteData(field, value);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error("❌ Erreur lors de l'auto-complétion:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'auto-complétion",
        error: error.message
      });
    }
  }

  // ✅ Récupérer tous les districts
  static async getAllDistricts(req, res) {
    try {
      const districts = await NouvelleDescente.getAllDistricts();

      res.json({
        success: true,
        data: districts
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des districts:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des districts",
        error: error.message
      });
    }
  }

  // ✅ Récupérer toutes les communes
  static async getAllCommunes(req, res) {
    try {
      const communes = await NouvelleDescente.getAllCommunes();

      res.json({
        success: true,
        data: communes
      });

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des communes:", error);
      
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des communes",
        error: error.message
      });
    }
  }
  // Dans votre fichier de contrôleur (ex: nouvelleDescenteController.js)
static async getDescentesParMois(req, res) {
  try {
    const { annee } = req.query;
    const descentesParMois = await NouvelleDescente.getDescentesParMois(annee);
    
    res.json({
      success: true,
      data: descentesParMois,
      message: "Statistiques mensuelles récupérées avec succès"
    });
  } catch (error) {
    console.error("Erreur contrôleur:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

static async getAnneesDisponibles(req, res) {
  try {
    const annees = await NouvelleDescente.getAnneesDisponibles();
    
    res.json({
      success: true,
      data: annees,
      message: "Années disponibles récupérées avec succès"
    });
  } catch (error) {
    console.error("Erreur contrôleur:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

static async getStatistiquesGlobales(req, res) {
  try {
    const { annee } = req.query;
    const stats = await NouvelleDescente.getStatistiquesGlobales(annee);
    
    res.json({
      success: true,
      data: stats,
      message: "Statistiques globales récupérées avec succès"
    });
  } catch (error) {
    console.error("Erreur contrôleur:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
// Dans votre fichier de contrôleur (ex: nouvelleDescenteController.js)
static async getStatistiquesParEtape(req, res) {
  try {
    const { annee } = req.query;
    const stats = await NouvelleDescente.getStatistiquesParEtape(annee);
    
    res.json({
      success: true,
      data: stats,
      message: "Statistiques par étape récupérées avec succès"
    });
  } catch (error) {
    console.error("Erreur contrôleur:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

static async getStatistiquesParEtapeAvecPourcentages(req, res) {
  try {
    const { annee } = req.query;
    const stats = await NouvelleDescente.getStatistiquesParEtapeAvecPourcentages(annee);
    
    res.json({
      success: true,
      data: stats,
      message: "Statistiques par étape avec pourcentages récupérées avec succès"
    });
  } catch (error) {
    console.error("Erreur contrôleur:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

static async getStatistiquesParEtapeParMois(req, res) {
  try {
    const { annee } = req.query;
    const stats = await NouvelleDescente.getStatistiquesParEtapeParMois(annee);
    
    res.json({
      success: true,
      data: stats,
      message: "Statistiques par étape par mois récupérées avec succès"
    });
  } catch (error) {
    console.error("Erreur contrôleur:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
}
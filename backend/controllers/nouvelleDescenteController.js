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
        localisation: req.body.localite,
        x_coord: req.body.X_coord || null,
        y_coord: req.body.Y_coord || null,
        x_long: req.body.Y_coord || null, // Correction: x_long devrait être Y_coord
        y_lat: req.body.X_coord || null,  // Correction: y_lat devrait être X_coord
        infraction: req.body.infraction,
        actions: req.body.actions ? req.body.actions.join(', ') : '',
        proprietaire: req.body.nomPersonneR,
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
}
// controllers/ftController.js
import FtModel from '../models/FtModel.js';

class FtController {
  // Créer un nouveau F.T.
  static async createFT(req, res) {
    try {
      const ftData = req.body;
      
      // Validation des données requises
      if (!ftData.reference_ft) {
        return res.status(400).json({
          success: false,
          message: 'Le champ reference_ft est obligatoire'
        });
      }

      // Vérifier si la référence existe déjà
      const referenceExists = await FtModel.checkReferenceExists(ftData.reference_ft);
      if (referenceExists) {
        return res.status(400).json({
          success: false,
          message: 'Cette référence FT existe déjà'
        });
      }

      // Création du FT
      const newFT = await FtModel.create(ftData);
      
      res.status(201).json({
        success: true,
        message: 'F.T. créé avec succès',
        data: newFT
      });
      
    } catch (error) {
      console.error('❌ Erreur création F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du F.T.',
        error: error.message
      });
    }
  }

  // Récupérer tous les F.T.
  static async getAllFT(req, res) {
    try {
      const allFT = await FtModel.findAll();
      res.json({
        success: true,
        data: allFT,
        count: allFT.length
      });
    } catch (error) {
      console.error('❌ Erreur récupération F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des F.T.',
        error: error.message
      });
    }
  }

  // Récupérer un F.T. par ID
  static async getFTById(req, res) {
    try {
      const { id } = req.params;
      const ft = await FtModel.findById(id);
      
      if (!ft) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: ft
      });
    } catch (error) {
      console.error('❌ Erreur récupération F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du F.T.',
        error: error.message
      });
    }
  }

  // Récupérer les F.T. par ID de rendez-vous
  static async getFTByRendezvousId(req, res) {
    try {
      const { rendezvousId } = req.params;
      const ft = await FtModel.findByRendezvousId(rendezvousId);
      
      res.json({
        success: true,
        data: ft,
        count: ft.length
      });
    } catch (error) {
      console.error('❌ Erreur récupération F.T. par rendez-vous:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des F.T.',
        error: error.message
      });
    }
  }

  // Mettre à jour le statut d'un F.T.
  static async updateFTStatus(req, res) {
    try {
      const { id } = req.params;
      const { status_dossier } = req.body;
      
      if (!status_dossier) {
        return res.status(400).json({
          success: false,
          message: 'Le champ status_dossier est obligatoire'
        });
      }
      
      const updatedFT = await FtModel.updateStatus(id, status_dossier);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: updatedFT
      });
    } catch (error) {
      console.error('❌ Erreur mise à jour statut F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    }
  }

  // CORRECTION : Mettre à jour les dossiers manquants avec gestion individuelle
static async updateMissingDossiers(req, res) {
  try {
    const { id } = req.params;
    const { missing_dossiers, missing_dossires } = req.body; // Accepte les deux formats
    
    // CORRECTION : Gérer les deux noms de champ possibles
    const missingDossiersArray = Array.isArray(missing_dossiers) 
      ? missing_dossiers 
      : (Array.isArray(missing_dossires) ? missing_dossires : []);
    
    console.log(`🔄 Mise à jour dossiers manquants pour FT ${id}:`, missingDossiersArray);
    
    const updatedFT = await FtModel.updateMissingDossiers(id, missingDossiersArray);
    
    if (!updatedFT) {
      return res.status(404).json({
        success: false,
        message: 'F.T. non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Dossiers manquants mis à jour avec succès',
      data: updatedFT
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour dossiers manquants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des dossiers manquants',
      error: error.message
    });
  }
}

  // Ajouter un dossier manquant spécifique
  static async addMissingDossier(req, res) {
    try {
      const { id } = req.params;
      const { dossier } = req.body;
      
      if (!dossier) {
        return res.status(400).json({
          success: false,
          message: 'Le champ dossier est obligatoire'
        });
      }
      
      const updatedFT = await FtModel.addMissingDossier(id, dossier);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Dossier manquant ajouté avec succès',
        data: updatedFT
      });
    } catch (error) {
      console.error('❌ Erreur ajout dossier manquant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du dossier manquant',
        error: error.message
      });
    }
  }

  // CORRECTION : Marquer un dossier comme fourni (un seul dossier à la fois)
  static async markDossierAsProvided(req, res) {
    try {
      const { id } = req.params;
      const { dossier } = req.body;
      
      if (!dossier) {
        return res.status(400).json({
          success: false,
          message: 'Le champ dossier est obligatoire'
        });
      }
      
      console.log(`🔄 Marquage dossier comme fourni pour FT ${id}:`, dossier);
      
      const updatedFT = await FtModel.markDossierAsProvided(id, dossier);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: `Dossier "${dossier}" marqué comme fourni avec succès`,
        data: updatedFT
      });
    } catch (error) {
      console.error('❌ Erreur marquage dossier fourni:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage du dossier comme fourni',
        error: error.message
      });
    }
  }

  // NOUVELLE MÉTHODE : Marquer plusieurs dossiers comme fournis
  static async markMultipleDossiersAsProvided(req, res) {
    try {
      const { id } = req.params;
      const { dossiers } = req.body;
      
      if (!dossiers || !Array.isArray(dossiers)) {
        return res.status(400).json({
          success: false,
          message: 'Le champ dossiers doit être un tableau'
        });
      }
      
      console.log(`🔄 Marquage multiple dossiers pour FT ${id}:`, dossiers);
      
      let updatedFT;
      
      // Marquer chaque dossier un par un
      for (const dossier of dossiers) {
        updatedFT = await FtModel.markDossierAsProvided(id, dossier);
      }
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: `${dossiers.length} dossier(s) marqué(s) comme fourni(s) avec succès`,
        data: updatedFT
      });
    } catch (error) {
      console.error('❌ Erreur marquage multiple dossiers:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage des dossiers comme fournis',
        error: error.message
      });
    }
  }

  // NOUVELLE MÉTHODE : Retirer un dossier manquant (alias pour markDossierAsProvided)
  static async removeMissingDossier(req, res) {
    try {
      const { id } = req.params;
      const { dossier } = req.body;
      
      if (!dossier) {
        return res.status(400).json({
          success: false,
          message: 'Le champ dossier est obligatoire'
        });
      }
      
      console.log(`🔄 Retrait dossier manquant pour FT ${id}:`, dossier);
      
      // Utiliser markDossierAsProvided pour retirer le dossier
      const updatedFT = await FtModel.markDossierAsProvided(id, dossier);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: `Dossier "${dossier}" retiré des manquants avec succès`,
        data: updatedFT
      });
    } catch (error) {
      console.error('❌ Erreur suppression dossier manquant:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du dossier manquant',
        error: error.message
      });
    }
  }

  // Vider tous les dossiers manquants
  static async clearMissingDossiers(req, res) {
    try {
      const { id } = req.params;
      
      const updatedFT = await FtModel.clearMissingDossiers(id);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Dossiers manquants vidés avec succès',
        data: updatedFT
      });
    } catch (error) {
      console.error('❌ Erreur vidage dossiers manquants:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du vidage des dossiers manquants',
        error: error.message
      });
    }
  }

  // NOUVELLE MÉTHODE : Obtenir les dossiers requis pour un FT
  static async getRequiredDossiers(req, res) {
    try {
      const { id } = req.params;
      
      const requiredDossiers = await FtModel.getRequiredDossiers(id);
      
      res.json({
        success: true,
        data: requiredDossiers
      });
    } catch (error) {
      console.error('❌ Erreur récupération dossiers requis:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des dossiers requis',
        error: error.message
      });
    }
  }

  // NOUVELLE MÉTHODE : Obtenir le statut de complétion par dossier
  static async getDossierCompletionStatus(req, res) {
    try {
      const { id } = req.params;
      
      const completionStatus = await FtModel.getDossierCompletionStatus(id);
      
      res.json({
        success: true,
        data: completionStatus
      });
    } catch (error) {
      console.error('❌ Erreur statut complétion dossiers:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut de complétion',
        error: error.message
      });
    }
  }

  // NOUVELLE MÉTHODE : Synchroniser avec les dossiers de la descente
  static async syncWithDescenteDossiers(req, res) {
    try {
      const { id } = req.params;
      
      const updatedFT = await FtModel.syncWithDescenteDossiers(id);
      
      if (!updatedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé ou non lié à une descente'
        });
      }
      
      res.json({
        success: true,
        message: 'F.T. synchronisé avec les dossiers requis de la descente',
        data: updatedFT
      });
    } catch (error) {
      console.error('❌ Erreur synchronisation descente:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la synchronisation avec les dossiers de la descente',
        error: error.message
      });
    }
  }

  // Supprimer un F.T.
  static async deleteFT(req, res) {
    try {
      const { id } = req.params;
      
      const deletedFT = await FtModel.delete(id);
      
      if (!deletedFT) {
        return res.status(404).json({
          success: false,
          message: 'F.T. non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'F.T. supprimé avec succès',
        data: deletedFT
      });
    } catch (error) {
      console.error('❌ Erreur suppression F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du F.T.',
        error: error.message
      });
    }
  }

  // Récupérer les statistiques
  static async getStats(req, res) {
    try {
      const stats = await FtModel.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erreur récupération stats F.T.:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }

  // NOUVELLE MÉTHODE : Migration des dossiers
  static async migrateAndSyncDossiers(req, res) {
    try {
      const result = await FtModel.migrateAndSyncDossiers();
      
      res.json({
        success: true,
        message: `Migration terminée: ${result.migrated}/${result.total} F.T. migrés`,
        data: result
      });
    } catch (error) {
      console.error('❌ Erreur migration dossiers:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la migration des dossiers',
        error: error.message
      });
    }
  }
  static async getStatsByStatus(req, res) {
  try {
    const result = await FtModel.getStatsByStatus();
    
    res.json({
      success: true,
      message: `Statistiques récupérées: ${result.length} statuts trouvés`,
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques par statut',
      error: error.message
    });
  }
}
static async getStatsByMonthAndStatus(req, res) {
  try {
    const result = await FtModel.getStatsByMonthAndStatus();

    res.json({
      success: true,
      message: `Statistiques récupérées: ${result.length} lignes trouvées`,
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur récupération statistiques (mois + statut):', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques par mois et statut',
      error: error.message
    });
  }
}
static async getTotalFT(req, res) {
    try {
      const result = await FtModel.getTotalFT();

      res.json({
        success: true,
        message: `Nombre total de FT : ${result.total_ft}`,
        data: result
      });
    } catch (error) {
      console.error('❌ Erreur récupération total FT:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du total FT',
        error: error.message
      });
    }
  }

}

export default FtController;
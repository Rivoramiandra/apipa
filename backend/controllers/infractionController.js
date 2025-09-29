import Infraction from '../models/infractionModel.js';

export const getInfractionsParCategorie = async (req, res) => {
  try {
    const { dateDebut, dateFin, commune } = req.query;
    
    let infractions;
    if (dateDebut || dateFin || commune) {
      infractions = await Infraction.getNombreInfractionsAvecFiltres({
        dateDebut,
        dateFin,
        commune
      });
    } else {
      infractions = await Infraction.getNombreInfractionsParCategorie();
    }

    const totalTerrains = infractions.reduce((sum, item) => sum + parseInt(item.nombre_de_terrains), 0);

    res.json({
      success: true,
      data: infractions,
      total: totalTerrains,
      nombreCategories: infractions.length
    });
  } catch (err) {
    console.error("Erreur contrôleur infractions:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des infractions"
    });
  }
};

export const getStatistiquesInfractions = async (req, res) => {
  try {
    const infractions = await Infraction.getNombreInfractionsParCategorie();
    
    const totalTerrains = infractions.reduce((sum, item) => sum + parseInt(item.nombre_de_terrains), 0);
    
    const dataAvecPourcentages = infractions.map(item => ({
      ...item,
      pourcentage: totalTerrains > 0 ? 
        ((parseInt(item.nombre_de_terrains) / totalTerrains) * 100).toFixed(2) : "0.00"
    }));

    res.json({
      success: true,
      data: dataAvecPourcentages,
      totalTerrains,
      nombreCategories: infractions.length
    });
  } catch (err) {
    console.error("Erreur contrôleur statistiques:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des statistiques"
    });
  }
};

export const getDetailsCategorie = async (req, res) => {
  try {
    const { categorie } = req.params;
    
    const details = await Infraction.getDetailsParCategorie(categorie);

    res.json({
      success: true,
      data: details,
      categorie: categorie
    });
  } catch (err) {
    console.error("Erreur contrôleur détails catégorie:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des détails de la catégorie"
    });
  }
};
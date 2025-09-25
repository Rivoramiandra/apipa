// controllers/cadastreController.js
import Cadastre from '../models/cadastreModel.js';

export const getAllCadastre = async (req, res) => {
  try {
    const cadastres = await Cadastre.getAll();

    // Créer un FeatureCollection GeoJSON
    const featureCollection = {
      type: "FeatureCollection",
      features: cadastres
        .filter(c => c.geom) // ignorer les lignes sans géométrie
        .map(c => ({
          type: "Feature",
          properties: {
            gid: c.gid,
            nom_sectio: c.nom_sectio,
            section: c.section,
            parcelle: c.parcelle,
            id: c.id,
            nom_plan: c.nom_plan,
            surface: c.surface,
          },
          geometry: JSON.parse(c.geom), // convertir en objet JSON
        }))
    };

    res.json(featureCollection);
  } catch (err) {
    console.error("Erreur cadastre:", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

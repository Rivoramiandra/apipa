import descenteModel from "../models/decenteModel.js";

export const getAllDescente = async (req, res) => {
  try {
    const descentes = await descenteModel.getAllAsGeoJSON();
    
    // S'assurer de retourner un tableau
    if (!Array.isArray(descentes)) {
      console.warn('Les données retournées ne sont pas un tableau:', descentes);
      return res.json([]);
    }
    
    console.log(`✅ ${descentes.length} descentes récupérées avec succès`);
    res.json(descentes);
  } catch (error) {
    console.error('Erreur dans getAllDescente:', error);
    res.status(500).json({ error: error.message });
  }
};
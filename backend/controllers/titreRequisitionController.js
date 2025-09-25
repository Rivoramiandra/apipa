import TitreRequisition from '../models/titreRequisitionModel.js';

export const getAllTitreRequisition = async (req, res) => {
  try {
    const titres = await TitreRequisition.getAll();

    const geoJson = titres.map(t => ({
      ...t,
      geom: t.geom ? JSON.parse(t.geom) : null,
    }));

    res.json(geoJson);
  } catch (err) {
    console.error("Erreur serveur TitreRequisition:", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

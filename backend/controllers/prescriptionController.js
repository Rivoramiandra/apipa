import Prescription from '../models/prescriptionModel.js';
import { simplify } from '@turf/turf';

const getAllPrescriptions = async (req, res) => {
  try {
    const { simplify: shouldSimplify = 'true', tolerance = '0.01' } = req.query;
    
    console.log(`📥 Chargement prescriptions avec simplification: ${shouldSimplify}, tolérance: ${tolerance}`);
    
    const prescriptions = await Prescription.getAll();
    
    // Convertir en GeoJSON FeatureCollection
    const geoJson = {
      type: "FeatureCollection",
      features: prescriptions
        .filter(p => p.geom)
        .map(p => ({
          type: "Feature",
          geometry: JSON.parse(p.geom),
          properties: {
            gid: p.gid,
            objectid: p.objectid,
            id: p.id,
            category: p.category,
            area: p.area,
            f_category: p.f_category,
            shape_leng: p.shape_leng,
            shape_area: p.shape_area
          }
        }))
    };

    console.log(`📊 ${geoJson.features.length} prescriptions chargées`);

    // Appliquer la simplification si demandée
    let finalData = geoJson;
    if (shouldSimplify === 'true') {
      const toleranceValue = parseFloat(tolerance);
      console.log(`⚡ Simplification avec tolérance: ${toleranceValue}`);
      
      finalData = {
        ...geoJson,
        features: geoJson.features.map(feature => ({
          ...feature,
          geometry: simplify(feature.geometry, { 
            tolerance: toleranceValue, 
            highQuality: true 
          })
        }))
      };
      
      console.log(`✅ Simplification terminée`);
    }

    res.json(finalData);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des prescriptions:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export { getAllPrescriptions };
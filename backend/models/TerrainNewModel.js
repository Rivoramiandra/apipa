import pool from "../config/db.js";

// polygonCoords = [[lng, lat], [lng, lat], ...]
const insertTerrain = async (terrainData) => {
  const {
    proprietaire,
    commune,
    fokontany,
    localisation,
    identification,
    X_coord,
    Y_coord,
    superficie,
    infraction,
    destination,
    montant,
    actions,
    modelePV,
    polygonCoords,
  } = terrainData;

  // Transformer les coordonnées en WKT pour PostGIS
  const coordsString = polygonCoords.map(c => `${c[0]} ${c[1]}`).join(", ");
  const wkt = `POLYGON((${coordsString}, ${polygonCoords[0][0]} ${polygonCoords[0][1]}))`;

  const query = `
    INSERT INTO terrains_geom (
      "PROPRIETAIRE",
      "COMMUNE",
      "FOKONTANY",
      "LOCALISATION",
      "IDENTIFICATION_DU_TERRAIN_parcelle_cadastrale_Titre",
      "X_coord",
      "y_coord",
      "SUPERFICIE_TERRAIN_m",
      "INFRACTIONS_CONSTATEES",
      "DESTINATION",
      "MONTANT_AMENDE",
      "ACTIONS",
      "MODELE_PV",
      geom
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, ST_GeomFromText($14, 4326))
    RETURNING *;
  `;

  const values = [
    proprietaire,
    commune,
    fokontany || null,
    localisation,
    identification,
    X_coord,
    Y_coord,
    superficie,
    infraction,
    destination,
    montant,
    JSON.stringify(actions),
    modelePV,
    wkt
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// 🔥 Nouvelle fonction pour récupérer tous les terrains
const getAllTerrains = async () => {
  const query = `
    SELECT 
      *,
      ST_AsGeoJSON(geom)::json AS geometry
    FROM terrains_geom;
  `;
  const result = await pool.query(query);
  return result.rows;
};

export default { insertTerrain, getAllTerrains };

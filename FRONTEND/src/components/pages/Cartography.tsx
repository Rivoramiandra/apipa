import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import proj4 from "proj4";
import "leaflet/dist/leaflet.css";
import { FaMap, FaSatellite, FaLayerGroup, FaSearch } from "react-icons/fa";
import { Package, Filter } from "lucide-react";

// Icône carré rouge pour les markers terrains
const redSquareIcon = new L.DivIcon({
  className: "custom-red-square",
  html: '<div style="width:12px;height:12px;background-color:red;border:1px solid #660000;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6],
});

// Icône pour le résultat de recherche
const searchIcon = new L.DivIcon({
  className: "custom-search-icon",
  html: '<div style="width:16px;height:16px;background-color:blue;border:2px solid white;border-radius:50%;box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

// Définition projection EPSG:8441 (Laborde Madagascar)
try {
  proj4.defs(
    "EPSG:8441",
    "+proj=omerc +lat_0=-18.9 +lonc=46.43722916666667 +alpha=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +towgs84=-189,-242,-91,0,0,0,0 +units=m +no_defs"
  );
  console.log("📌 Vérification EPSG:8441:", proj4.defs("EPSG:8441"));
} catch (e) {
  console.error("Erreur enregistrement EPSG:8441:", e);
}

// Fonction pour reprojeter un GeoJSON
const reprojectGeoJSON = (geojson: any) => {
  const fromProj = "EPSG:8441";
  const toProj = "EPSG:4326";

  if (!proj4.defs(fromProj)) return geojson;
  if (!geojson?.features || !Array.isArray(geojson.features)) return geojson;

  const newGeo = JSON.parse(JSON.stringify(geojson));

  const reprojectCoords = (coords: any[]): any[] => {
    if (!coords) return coords;
    if (typeof coords[0] === "number") {
      const [x, y] = coords;
      try {
        return proj4(fromProj, toProj, [x, y]);
      } catch {
        return [x, y];
      }
    }
    return coords.map(reprojectCoords);
  };

  newGeo.features.forEach((f: any) => {
    if (f?.geometry?.coordinates) {
      f.geometry.coordinates = reprojectCoords(f.geometry.coordinates);
    }
  });

  return newGeo;
};

// FitBounds pour markers
const FitBounds = ({ data }: { data: any[] }) => {
  const map = useMap();
  useEffect(() => {
    const coords = data
      .filter(d => d.lat && d.lng)
      .map(d => [d.lat, d.lng] as [number, number]);
    if (coords.length) {
      const bounds = L.latLngBounds(coords);
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [data, map]);
  return null;
};

// FitBounds pour GeoJSON
const FitGeoJSONBounds = ({ geojson }: { geojson: any }) => {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
      else map.setView([-18.8792, 47.5079], 6);
    } catch {
      map.setView([-18.8792, 47.5079], 6);
    }
  }, [geojson, map]);
  return null;
};

const Cartography: React.FC = () => {
  const [landData, setLandData] = useState<any[]>([]);
  const [geoJsonLimits, setGeoJsonLimits] = useState<any | null>(null);
  const [cadastreData, setCadastreData] = useState<any | null>(null);
  const [titreRequisitionData, setTitreRequisitionData] = useState<any | null>(null);
  const [demandeFnData, setDemandeFnData] = useState<any | null>(null);
  const [titresSansNomData, setTitresSansNomData] = useState<any | null>(null);
  const [searchX, setSearchX] = useState("");
  const [searchY, setSearchY] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);
  
  // États pour contrôler la visibilité des couches
  const [showCadastre, setShowCadastre] = useState(true);
  const [showTitreRequisition, setShowTitreRequisition] = useState(true);
  const [showDemandeFn, setShowDemandeFn] = useState(true);
  const [showTitresSansNom, setShowTitresSansNom] = useState(true);
  const [showLimites, setShowLimites] = useState(true);
  const [showTerrains, setShowTerrains] = useState(true);

  // Terrains
  useEffect(() => {
    const fetchTerrains = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/terrains");
        
        const data = await res.json();
        setLandData(
          data
            .map((d: any) => ({
              ...d,
              lat: parseFloat(d.lat),
              lng: parseFloat(d.lng),
            }))
            .filter(d => !isNaN(d.lat) && !isNaN(d.lng))
        );
      } catch (err) {
        console.error("Erreur terrains:", err);
      }
    };
    fetchTerrains();
  }, []);

  // Limites administratives
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/shapefiles/limites");
        const data = await res.json();
        setGeoJsonLimits(
          reprojectGeoJSON({
            type: "FeatureCollection",
            features: data
              .filter((d: any) => d.geom)
              .map((d: any) => ({
                type: "Feature",
                geometry: d.geom,
                properties: { id: d.id, commune: d.commune },
              })),
          })
        );
      } catch (err) {
        console.error("Erreur limites:", err);
      }
    };
    fetchLimits();
  }, []);

  // Cadastre
  useEffect(() => {
    const fetchCadastre = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/cadastre");
        const data = await res.json();
        if (data?.type === "FeatureCollection" && Array.isArray(data.features)) {
          setCadastreData(reprojectGeoJSON(data));
        } else {
          console.error("Cadastre: format de données invalide", data);
        }
      } catch (err) {
        console.error("Erreur cadastre:", err);
      }
    };
    fetchCadastre();
  }, []);

  // Titre Requisition
  useEffect(() => {
    const fetchTitre = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/titrerequisition");
        const data = await res.json();
        const fc = {
          type: "FeatureCollection",
          features: data
            .filter((t: any) => t.geom)
            .map((t: any) => ({
              type: "Feature",
              geometry: t.geom,
              properties: {
                titre: t.titre,
                properiete: t.properiete,
                parcelle: t.parcelle,
                id: t.gid,
              },
            })),
        };
        setTitreRequisitionData(reprojectGeoJSON(fc));
      } catch (err) {
        console.error("Erreur titre requisition:", err);
      }
    };
    fetchTitre();
  }, []);

  // Demande FN
  useEffect(() => {
    const fetchDemandeFn = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/demandefn");
        const data = await res.json();
        const fc = {
          type: "FeatureCollection",
          features: data
            .filter((d: any) => d.geom)
            .map((d: any) => ({
              type: "Feature",
              geometry: d.geom,
              properties: {
                gid: d.gid,
                n_fn_fg: d.n_fn_fg,
                demandeur: d.demandeur,
                sur_plan: d.sur_plan,
                localite: d.localite,
                fokontany: d.fokontany,
                situation: d.situation,
                aire_cal: d.aire_cal,
              },
            })),
        };
        setDemandeFnData(reprojectGeoJSON(fc));
      } catch (err) {
        console.error("Erreur demande FN:", err);
      }
    };
    fetchDemandeFn();
  }, []);

  // Titres Sans Nom
  useEffect(() => {
    const fetchTitresSansNom = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/titresansnom");
        const data = await res.json();
        if (data?.type === "FeatureCollection" && Array.isArray(data.features)) {
          setTitresSansNomData(reprojectGeoJSON(data));
        } else {
          console.error("TitresSansNom: format de données invalide", data);
        }
      } catch (err) {
        console.error("Erreur titres sans nom:", err);
      }
    };
    fetchTitresSansNom();
  }, []);

  // Recherche terrain par coordonnées X Y
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const x = parseFloat(searchX);
    const y = parseFloat(searchY);
    
    if (isNaN(x) || isNaN(y)) {
      alert("Coordonnées X Y invalides");
      return;
    }

    try {
      // Convertir les coordonnées X Y (EPSG:8441) en latitude/longitude (EPSG:4326)
      const [lng, lat] = proj4("EPSG:8441", "EPSG:4326", [x, y]);
      
      // Trouver le terrain le plus proche (dans un rayon de 100m)
      let closestPlot = null;
      let minDistance = Infinity;
      
      landData.forEach(plot => {
        const distance = Math.sqrt(Math.pow(plot.lat - lat, 2) + Math.pow(plot.lng - lng, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestPlot = plot;
        }
      });
      
      // Si on a trouvé un terrain à moins de 0.001 degrés (environ 100m)
      if (closestPlot && minDistance < 0.001) {
        setSearchResult(closestPlot);
        setSearchMarker([lat, lng]);
        
        // Centrer la carte sur le point recherché
        const map = L.DomUtil.get('map');
        if (map) {
          map.setView([lat, lng], 16);
        }
      } else {
        setSearchResult(null);
        setSearchMarker([lat, lng]);
        alert("Aucun terrain trouvé à proximité de ces coordonnées.");
      }
    } catch (error) {
      console.error("Erreur lors de la conversion des coordonnées:", error);
      alert("Erreur lors de la conversion des coordonnées");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cartographie des Terrains</h1>
          <p className="text-slate-600 mt-1">Visualisation des données géospatiales</p>
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Package className="w-4 h-4" />
          <span>Exporter les données</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Terrains</p>
              <p className="text-2xl font-bold text-slate-800">{landData.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Cadastre</p>
              <p className="text-2xl font-bold text-blue-600">
                {cadastreData?.features?.length || 0}
              </p>
            </div>
            <FaLayerGroup className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Titres Réquisition</p>
              <p className="text-2xl font-bold text-green-600">
                {titreRequisitionData?.features?.length || 0}
              </p>
            </div>
            <FaLayerGroup className="w-6 h-6 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Demandes FN</p>
              <p className="text-2xl font-bold text-orange-600">
                {demandeFnData?.features?.length || 0}
              </p>
            </div>
            <FaLayerGroup className="w-6 h-6 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Titres Sans Nom</p>
              <p className="text-2xl font-bold text-purple-600">
                {titresSansNomData?.features?.length || 0}
              </p>
            </div>
            <FaLayerGroup className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Limites</p>
              <p className="text-2xl font-bold text-red-600">
                {geoJsonLimits?.features?.length || 0}
              </p>
            </div>
            <FaLayerGroup className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="Coord X"
                  value={searchX}
                  onChange={(e) => setSearchX(e.target.value)}
                  className="pl-3 pr-4 py-2 w-32 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="Coord Y"
                  value={searchY}
                  onChange={(e) => setSearchY(e.target.value)}
                  className="pl-3 pr-4 py-2 w-32 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button 
                onClick={() => handleSearch()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaSearch className="w-4 h-4" />
                {/* <span>Rechercher</span> */}
              </button>
            </div>
{/*             
            <button className="flex items-center space-x-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <Filter className="w-4 h-4" />
              <span>Filtres avancés</span>
            </button> */}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setIsSatelliteView(!isSatelliteView)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSatelliteView
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isSatelliteView ? <FaMap className="w-4 h-4" /> : <FaSatellite className="w-4 h-4" />}
              <span>{isSatelliteView ? 'Vue Carte' : 'Vue Satellite'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ height: "80vh" }}>
        <MapContainer 
          center={[-18.8792, 47.5079]} 
          zoom={6} 
          style={{ height: "100%", width: "100%" }}
          id="map"
        >
          {/* TileLayers */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={isSatelliteView ? 0 : 1}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={isSatelliteView ? 1 : 0}
          />

          {/* FitBounds */}
          <FitBounds data={landData} />
          {geoJsonLimits && <FitGeoJSONBounds geojson={geoJsonLimits} />}
          {cadastreData && <FitGeoJSONBounds geojson={cadastreData} />}
          {titreRequisitionData && <FitGeoJSONBounds geojson={titreRequisitionData} />}
          {demandeFnData && <FitGeoJSONBounds geojson={demandeFnData} />}
          {titresSansNomData && <FitGeoJSONBounds geojson={titresSansNomData} />}

          {/* Markers terrains */}
          {showTerrains && landData.map((plot, idx) => (
            <Marker key={idx} position={[plot.lat, plot.lng]} icon={redSquareIcon}>
              <Popup className="custom-popup">
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800">Information Terrain</h3>
                  <p><strong>Propriétaire:</strong> {plot.PROPRIETAIRE}</p>
                  <p><strong>Commune:</strong> {plot.COMMUNE}</p>
                  <p><strong>Fokontany:</strong> {plot.FOKONTANY || "?"}</p>
                  <p><strong>Localisation:</strong> {plot.LOCALISATION || "?"}</p>
                  <p><strong>ID:</strong> {plot.IDENTIFICATION_DU_TERRAIN_parcelle_cadastrale_TITLE || "?"}</p>
                  <p><strong>Superficie:</strong> {plot.SUPERFICIE_TERRAIN_m} m²</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marker pour le résultat de recherche */}
          {searchMarker && (
            <Marker position={searchMarker} icon={searchIcon}>
              <Popup>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800">Point de Recherche</h3>
                  <p><strong>Coordonnées:</strong> {searchMarker[0].toFixed(6)}, {searchMarker[1].toFixed(6)}</p>
                  <p><strong>Coordonnées X/Y:</strong> {searchX}, {searchY}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Limites administratives */}
          {showLimites && geoJsonLimits && (
            <GeoJSON
              data={geoJsonLimits}
              style={{ color: "red", weight: 3, dashArray: "4,4" }}
              onEachFeature={(f, layer) =>
                layer.bindPopup(`
                  <div class="space-y-2">
                    <h3 class="font-bold text-slate-800">Limite Administrative</h3>
                    <p><strong>Commune:</strong> ${f.properties.commune}</p>
                    <p><strong>ID:</strong> ${f.properties.id}</p>
                  </div>
                `)
              }
            />
          )}

          {/* Cadastre */}
          {showCadastre && cadastreData && (
            <GeoJSON
              data={cadastreData}
              style={{ color: "blue", weight: 1, fillOpacity: 0.2 }}
              onEachFeature={(f, layer) => layer.bindPopup(`
                <div class="space-y-2">
                  <h3 class="font-bold text-slate-800">Cadastre</h3>
                  <p><strong>Id:</strong> ${f.properties.id}</p>
                  <p><strong>Nom section:</strong> ${f.properties.nom_sectio}</p>
                  <p><strong>Nom plan:</strong> ${f.properties.nom_plan}</p>
                  <p><strong>Surface:</strong> ${f.properties.surface}</p>
                </div>
              `)}
            />
          )}

          {/* Titre Requisition */}
          {showTitreRequisition && titreRequisitionData && (
            <GeoJSON
              data={titreRequisitionData}
              style={{ color: "green", weight: 1, fillOpacity: 0.2 }}
              onEachFeature={(f, layer) =>
                layer.bindPopup(`
                  <div class="space-y-2">
                    <h3 class="font-bold text-slate-800">Titre Réquisition</h3>
                    <p><strong>Titre:</strong> ${f.properties.titre}</p>
                    <p><strong>Propriété:</strong> ${f.properties.properiete}</p>
                    <p><strong>Parcelle:</strong> ${f.properties.parcelle}</p>
                    <p><strong>ID:</strong> ${f.properties.id}</p>
                  </div>
                `)
              }
            />
          )}

          {/* Demande FN */}
          {showDemandeFn && demandeFnData && (
            <GeoJSON
              data={demandeFnData}
              style={{ color: "orange", weight: 1, fillOpacity: 0.3 }}
              onEachFeature={(f, layer) =>
                layer.bindPopup(`
                  <div class="space-y-2">
                    <h3 class="font-bold text-slate-800">Demande FN</h3>
                    <p><strong>Demandeur:</strong> ${f.properties.demandeur || "-"}</p>
                    <p><strong>Référence:</strong> ${f.properties.n_fn_fg || "-"}</p>
                    <p><strong>Localité:</strong> ${f.properties.localite || "-"}</p>
                    <p><strong>Fokontany:</strong> ${f.properties.fokontany || "-"}</p>
                    <p><strong>Situation:</strong> ${f.properties.situation || "-"}</p>
                    <p><strong>Superficie:</strong> ${f.properties.aire_cal || "-"}</p>
                  </div>
                `)
              }
            />
          )}

          {/* Titres Sans Nom */}
          {showTitresSansNom && titresSansNomData && (
            <GeoJSON
              data={titresSansNomData}
              style={{ color: "purple", weight: 1, fillOpacity: 0.2 }}
              onEachFeature={(f, layer) =>
                layer.bindPopup(`
                  <div class="space-y-2">
                    <h3 class="font-bold text-slate-800">Titre Sans Nom</h3>
                    <p><strong>Titre:</strong> ${f.properties.titre || "-"}</p>
                    <p><strong>Propriété:</strong> ${f.properties.propriete || "-"}</p>
                    <p><strong>Parcelle:</strong> ${f.properties.parcelle || "-"}</p>
                    <p><strong>ID:</strong> ${f.properties.gid || "-"}</p>
                  </div>
                `)
              }
            />
          )}

          {/* Contrôles des couches */}
          <div className="absolute bottom-5 left-4 z-[1000] bg-white p-4 rounded-lg shadow-md max-h-[70vh] overflow-y-auto">
            <h4 className="mb-3 font-bold text-slate-800">Couches</h4>
            
            {[
              { id: "terrains-toggle", label: "Terrains", checked: showTerrains, onChange: () => setShowTerrains(!showTerrains) },
              { id: "limites-toggle", label: "Limites administratives", checked: showLimites, onChange: () => setShowLimites(!showLimites) },
              { id: "cadastre-toggle", label: "Cadastre", checked: showCadastre, onChange: () => setShowCadastre(!showCadastre) },
              { id: "titre-toggle", label: "Titre Réquisition", checked: showTitreRequisition, onChange: () => setShowTitreRequisition(!showTitreRequisition) },
              { id: "demande-toggle", label: "Demande FN", checked: showDemandeFn, onChange: () => setShowDemandeFn(!showDemandeFn) },
              { id: "titres-sans-nom-toggle", label: "Titres Sans Nom", checked: showTitresSansNom, onChange: () => setShowTitresSansNom(!showTitresSansNom) },
            ].map((layer) => (
              <div key={layer.id} className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id={layer.id} 
                  checked={layer.checked} 
                  onChange={layer.onChange}
                  className="mr-2"
                />
                <label htmlFor={layer.id} className="text-sm text-slate-700">{layer.label}</label>
              </div>
            ))}
          </div>

          {/* Légende */}
          <div className="absolute bottom-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-md max-w-[180px]">
            <h4 className="mb-2 font-bold text-slate-800">Légende</h4>
            
            {[
              { color: "blue", label: "Cadastre" },
              { color: "green", label: "Titre Réquisition" },
              { color: "orange", label: "Demande FN" },
              { color: "purple", label: "Titres Sans Nom" },
              { color: "red", label: "Terrains", square: true },
              { color: "red", label: "Limites", dash: true },
              { color: "blue", label: "Recherche", circle: true },
            ].map((item, index) => (
              <div key={index} className="flex items-center mb-2">
                {item.dash ? (
                  <div className="w-4 h-1 mr-2 bg-red-500"></div>
                ) : item.square ? (
                  <div className="w-3 h-3 mr-2 bg-red-500 border border-red-700"></div>
                ) : item.circle ? (
                  <div className="w-3 h-3 mr-2 bg-blue-500 border-2 border-white rounded-full"></div>
                ) : (
                  <div className="w-3 h-3 mr-2" style={{ backgroundColor: item.color }}></div>
                )}
                <span className="text-xs text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Résultat de recherche */}
          {searchResult && (
            <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-md max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-800">Terrain Trouvé</h4>
                <button 
                  onClick={() => setSearchResult(null)} 
                  className="text-slate-500 hover:text-slate-700"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Propriétaire:</strong> {searchResult.PROPRIETAIRE}</p>
                <p><strong>Commune:</strong> {searchResult.COMMUNE}</p>
                <p><strong>Fokontany:</strong> {searchResult.FOKONTANY || "?"}</p>
                <p><strong>Localisation:</strong> {searchResult.LOCALISATION || "?"}</p>
                <p><strong>ID:</strong> {searchResult.IDENTIFICATION_DU_TERRAIN_parcelle_cadastrale_TITLE || "?"}</p>
                <p><strong>Superficie:</strong> {searchResult.SUPERFICIE_TERRAIN_m} m²</p>
              </div>
            </div>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default Cartography;
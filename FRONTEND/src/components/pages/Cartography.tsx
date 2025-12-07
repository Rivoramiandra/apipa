import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import proj4 from "proj4";
import "leaflet/dist/leaflet.css";

import { Search, Map, Satellite, Layers, X, ZoomIn, ZoomOut } from "lucide-react";

// Icônes pour les descentes selon l'état FT et paiements
const descenteIconRouge = new L.DivIcon({
  className: "custom-descente-icon-rouge",
  html: '<div style="width:12px;height:12px;background-color:red;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.7);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const descenteIconVert = new L.DivIcon({
  className: "custom-descente-icon-vert",
  html: '<div style="width:12px;height:12px;background-color:green;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.7);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const descenteIconJaune = new L.DivIcon({
  className: "custom-descente-icon-jaune",
  html: '<div style="width:12px;height:12px;background-color:yellow;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.7);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const descenteIconBleu = new L.DivIcon({
  className: "custom-descente-icon-bleu",
  html: '<div style="width:12px;height:12px;background-color:blue;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.7);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

// Icône pour le résultat de recherche
const searchIcon = new L.DivIcon({
  className: "custom-search-icon",
  html: '<div style="width:16px;height:16px;background-color:purple;border:2px solid white;border-radius:50%;box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

// Fonction pour déterminer l'icône en fonction des relations FT, Avis, Paiement
const getDescenteIcon = (descente: any) => {
  const { details } = descente;
  
  // Condition PAIEMENT COMPLET : FT créé + Avis émis + Paiement effectué
  if (details?.ft_id && details?.avis_id && details?.paiement_id) {
    return descenteIconBleu; // Point bleu pour paiement complet
  }
  
  // Condition AVIS ÉMIS : FT créé + Avis émis (paiement en attente)
  if (details?.ft_id && details?.avis_id) {
    return descenteIconJaune; // Point jaune pour avis émis
  }
  
  // Condition FT CRÉÉ : FT créé seulement
  if (details?.ft_id) {
    return descenteIconVert; // Point vert pour FT créé
  }
  
  // Sinon, descente en cours → rouge
  return descenteIconRouge;
};

// Définition projection EPSG:8441 (Laborde Madagascar)
try {
  proj4.defs(
    "EPSG:8441",
    "+proj=omerc +lat_0=-18.9 +lonc=46.43722916666667 +alpha=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +towgs84=-189,-242,-91,0,0,0,0 +units=m +no_defs"
  );
} catch (e) {
  console.error("Erreur enregistrement EPSG:8441:", e);
}

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

// Fonction pour convertir Laborde vers WGS84
const convertLabordeToWGS84 = (x: number, y: number): [number, number] => {
  try {
    const result = proj4("EPSG:8441", "EPSG:4326", [x, y]);
    return [result[1], result[0]]; // proj4 retourne [lng, lat], on veut [lat, lng]
  } catch (error) {
    console.error("Erreur conversion Laborde:", error);
    throw new Error("Erreur lors de la conversion des coordonnées");
  }
};

// Fonction pour convertir WGS84 vers Laborde
const convertWGS84ToLaborde = (lat: number, lng: number): [number, number] => {
  try {
    const result = proj4("EPSG:4326", "EPSG:8441", [lng, lat]); // proj4 attend [lng, lat]
    return [result[0], result[1]];
  } catch (error) {
    console.error("Erreur conversion WGS84 vers Laborde:", error);
    throw new Error("Erreur lors de la conversion des coordonnées");
  }
};

const Cartography: React.FC = () => {
  const [descentes, setDescentes] = useState<any[]>([]);
  
  // États pour la recherche
  const [searchType, setSearchType] = useState<'latlon' | 'laborde'>('latlon');
  const [searchLat, setSearchLat] = useState("");
  const [searchLon, setSearchLon] = useState("");
  const [searchX, setSearchX] = useState("");
  const [searchY, setSearchY] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);
  
  // États pour l'interface
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  
  // États pour contrôler la visibilité des couches - AJOUT DES FILTRES PAR COULEUR
  const [showDescentes, setShowDescentes] = useState(true);
  const [showRouge, setShowRouge] = useState(true);
  const [showVert, setShowVert] = useState(true);
  const [showJaune, setShowJaune] = useState(true);
  const [showBleu, setShowBleu] = useState(true);

  const mapRef = useRef<L.Map | null>(null);

  // Fonction pour déterminer la couleur d'une descente
  const getDescenteCouleur = (descente: any) => {
    const { details } = descente;
    
    if (details?.ft_id && details?.avis_id && details?.paiement_id) {
      return 'bleu'; // Paiement complet
    }
    
    if (details?.ft_id && details?.avis_id) {
      return 'jaune'; // Avis émis
    }
    
    if (details?.ft_id) {
      return 'vert'; // FT créé
    }
    
    return 'rouge'; // Descente en cours
  };

  // Filtrer les descentes selon les couleurs sélectionnées
  const filteredDescentes = descentes.filter(descente => {
    if (!showDescentes) return false;
    
    const couleur = getDescenteCouleur(descente);
    
    switch (couleur) {
      case 'rouge':
        return showRouge;
      case 'vert':
        return showVert;
      case 'jaune':
        return showJaune;
      case 'bleu':
        return showBleu;
      default:
        return true;
    }
  });

  // Chargement des données des descentes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resDescentes = await fetch("http://localhost:3000/api/nouvelle-descente/carte/descentes");
        if (!resDescentes.ok) throw new Error(`Erreur HTTP pour descentes: ${resDescentes.status}`);
        const dataDescentes = await resDescentes.json();

        console.log("Données reçues de l'API descentes:", dataDescentes);

        let processedDescentes: any[] = [];

        if (dataDescentes.success && Array.isArray(dataDescentes.data)) {
          processedDescentes = dataDescentes.data.map((item: any) => {
            // CORRECTION : Dans vos données, les valeurs sont INVERSEES
            const labordeY = item.lat;  // C'est en réalité Y Laborde
            const labordeX = item.lng;  // C'est en réalité X Laborde
            
            if (typeof labordeX !== 'number' || isNaN(labordeX) || typeof labordeY !== 'number' || isNaN(labordeY)) {
              console.warn("Coordonnées Laborde invalides pour la descente:", item.id);
              return null;
            }
            
            try {
              const [lat, lng] = convertLabordeToWGS84(labordeX, labordeY);
              
              console.log("Conversion Laborde → WGS84:", 
                { 
                  id: item.id,
                  laborde_x: labordeX,
                  laborde_y: labordeY,
                  wgs84: [lat, lng] 
                });
              
              return {
                id: item.id || "N/A",
                reference: item.reference || null,
                localisation: item.localisation || "Non spécifié",
                commune: item.commune || "Non spécifié",
                verbalisateur: item.verbalisateur || "Non spécifié",
                infraction: item.infraction || "Infraction non spécifiée",
                date_descente: item.date_descente || null,
                couleur: item.couleur || "rouge",
                statut: item.statut || "Non traité",
                details: item.details || {},
                lat,
                lng,
                laborde_x: labordeX,
                laborde_y: labordeY,
              };
            } catch (error) {
              console.error("Erreur conversion descente:", error);
              return null;
            }
          }).filter(Boolean);
        } else {
          console.error("Format de données invalide pour les descentes");
        }
        
        console.log(`🎯 ${processedDescentes.length} descentes traitées`);
        setDescentes(processedDescentes);

      } catch (error) {
        console.error("Erreur lors du chargement des données", error);
      }
    };
    
    fetchData();
  }, []);

  // Fonction de recherche
  const handleSearch = () => {
    try {
      let lat: number, lng: number;

      if (searchType === 'latlon') {
        lat = parseFloat(searchLat);
        lng = parseFloat(searchLon);
        
        if (isNaN(lat) || isNaN(lng)) {
          alert("Coordonnées Lat/Lon invalides");
          return;
        }
      } else {
        const x = parseFloat(searchX);
        const y = parseFloat(searchY);
        
        if (isNaN(x) || isNaN(y)) {
          alert("Coordonnées Laborde invalides");
          return;
        }

        [lat, lng] = convertLabordeToWGS84(x, y);
      }

      const points = [...filteredDescentes.map(d => ({ ...d, type: 'descente' as const }))];
      
      let closestPoint = null;
      let minDistance = Infinity;
      
      points.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      });
      
      if (closestPoint && minDistance < 0.001) {
        setSearchResult(closestPoint);
        setSearchMarker([lat, lng]);
        
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
      } else {
        setSearchResult(null);
        setSearchMarker([lat, lng]);
        
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
        
        alert("Aucune descente trouvée à proximité de ces coordonnées.");
      }
      
      setShowSearchModal(false);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      alert("Erreur lors de la recherche");
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50">
      {/* Header avec titre */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Cartographie des Descentes - Madagascar</h1>
      </div>

      {/* Conteneur principal */}
      <div className="flex-1 ">
        <MapContainer 
          center={[-18.8792, 47.5079]} 
          zoom={6} 
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          zoomControl={false}
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

          {/* FitBounds avec les descentes filtrées */}
          <FitBounds data={filteredDescentes} />

          {/* Markers descentes FILTRÉS */}
          {filteredDescentes.map((d, i) => (
            <Marker 
              key={i} 
              position={[d.lat, d.lng]} 
              icon={getDescenteIcon(d)}
            >
              <Popup>
                <div className="space-y-2 min-w-[280px]">
                  {/* Badge d'état FT/AP/Paiement */}
                  <div className={`px-2 py-1 rounded text-sm font-medium inline-block ${
                    d.details?.ft_id && d.details?.avis_id && d.details?.paiement_id
                      ? 'bg-blue-100 text-blue-800'
                      : d.details?.ft_id && d.details?.avis_id
                      ? 'bg-yellow-100 text-yellow-800'
                      : d.details?.ft_id
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {d.details?.ft_id && d.details?.avis_id && d.details?.paiement_id
                      ? 'Paiement Complet ✓'
                      : d.details?.ft_id && d.details?.avis_id
                      ? 'Avis Émis ✓'
                      : d.details?.ft_id
                      ? 'FT Créé ✓'
                      : 'Descente en cours'}
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-800 border-b pb-2">
                    Descente {d.id}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Localité :</strong></div>
                    <div>{d.localisation || "Non spécifié"}</div>
                    <div><strong>Commune :</strong></div>
                    <div>{d.commune || "Non spécifié"}</div>
                    <div><strong>Verbalisateur :</strong></div>
                    <div>{d.verbalisateur}</div>
                    <div><strong>Infraction :</strong></div>
                    <div>{d.infraction}</div>
                    
                    <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                      <div className="font-semibold text-slate-700 mb-1">État du processus :</div>
                      {d.details?.ft_id && d.details?.avis_id && d.details?.paiement_id ? (
                        <div className="text-blue-600 text-sm">✓ Paiement Complet - Dossier finalisé</div>
                      ) : d.details?.ft_id && d.details?.avis_id ? (
                        <div className="text-yellow-600 text-sm">✓ Avis Émis - Paiement en attente</div>
                      ) : d.details?.ft_id ? (
                        <div className="text-green-600 text-sm">✓ FT Créé - Avis en attente</div>
                      ) : (
                        <div className="text-red-600 text-sm">
                          Descente à traiter - FT à créer
                        </div>
                      )}
                      
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>FT créé:</span>
                          <span className={d.details?.ft_id ? "text-green-600 font-semibold" : "text-red-600"}>
                            {d.details?.ft_id ? "✓ Oui" : "✗ Non"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avis émis:</span>
                          <span className={d.details?.avis_id ? "text-green-600 font-semibold" : "text-red-600"}>
                            {d.details?.avis_id ? "✓ Oui" : "✗ Non"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paiement effectué:</span>
                          <span className={d.details?.paiement_id ? "text-green-600 font-semibold" : "text-red-600"}>
                            {d.details?.paiement_id ? "✓ Oui" : "✗ Non"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                      <div className="font-semibold text-slate-700 mb-1">Coordonnées du terrain :</div>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div><strong>WGS84 (Lat/Lon) :</strong> {d.lat?.toFixed(6)}, {d.lng?.toFixed(6)}</div>
                        <div><strong>Laborde (X/Y) :</strong> {d.laborde_x?.toFixed(2)}, {d.laborde_y?.toFixed(2)}</div>
                      </div>
                    </div>

                    {d.date_descente && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                        <div className="font-semibold text-slate-700 mb-1">Date de descente :</div>
                        <div className="text-sm">{new Date(d.date_descente).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                  </div>
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
                  {searchType === 'laborde' && (
                    <p><strong>Coordonnées X/Y:</strong> {searchX}, {searchY}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* CONTROLES EN HAUT A GAUCHE */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2 z-[1000]">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => mapRef.current?.zoomIn()}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 border-b border-slate-200 transition-colors"
                title="Zoom avant"
              >
                <ZoomIn size={18} className="text-slate-700" />
              </button>
              <button
                onClick={() => mapRef.current?.zoomOut()}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut size={18} className="text-slate-700" />
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setShowSearchModal(true)}
                className="w-10 h-10 flex items-center justify-center hover:bg-blue-50 transition-colors"
                title="Rechercher par coordonnées"
              >
                <Search size={18} className="text-blue-600" />
              </button>
            </div>
          </div>

          {/* Bouton vue satellite en haut à droite */}
          <div className="absolute top-4 right-4 z-[1000]">
            <button
              onClick={() => setIsSatelliteView(!isSatelliteView)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md ${
                isSatelliteView
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isSatelliteView ? (
                <>
                  <Map size={16} />
                  <span>Vue Carte</span>
                </>
              ) : (
                <>
                  <Satellite size={16} />
                  <span>Vue Satellite</span>
                </>
              )}
            </button>
          </div>

          {/* Panneau des couches MODIFIÉ AVEC LES 4 FILTRES DE COULEUR */}
          <div className={`absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-md transition-all duration-300 ${
            showLayersPanel ? 'w-64' : 'w-auto'
          }`}>
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Layers size={16} className="text-slate-600" />
                <h4 className="font-semibold text-slate-800">Filtres Descentes</h4>
              </div>
              <button
                onClick={() => setShowLayersPanel(!showLayersPanel)}
                className="text-slate-500 hover:text-slate-700"
              >
                {showLayersPanel ? <X size={16} /> : <Layers size={16} />}
              </button>
            </div>

            {showLayersPanel && (
              <div className="p-3 max-h-96 overflow-y-auto">
                {/* Toggle général pour toutes les descentes */}
                <div className="flex items-center mb-4 pb-3 border-b border-slate-200">
                  <input
                    type="checkbox"
                    id="descentes"
                    checked={showDescentes}
                    onChange={(e) => setShowDescentes(e.target.checked)}
                    className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="descentes" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Toutes les descentes ({descentes.length})
                  </label>
                </div>

                {/* Filtres par couleur */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="filtre-rouge"
                      checked={showRouge}
                      onChange={(e) => setShowRouge(e.target.checked)}
                      disabled={!showDescentes}
                      className="mr-2 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                    />
                    <label htmlFor="filtre-rouge" className="text-sm text-slate-700 cursor-pointer flex items-center">
                      <div className="w-3 h-3 mr-2 bg-red-500 rounded-full"></div>
                      Descente en cours ({descentes.filter(d => getDescenteCouleur(d) === 'rouge').length})
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="filtre-vert"
                      checked={showVert}
                      onChange={(e) => setShowVert(e.target.checked)}
                      disabled={!showDescentes}
                      className="mr-2 w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <label htmlFor="filtre-vert" className="text-sm text-slate-700 cursor-pointer flex items-center">
                      <div className="w-3 h-3 mr-2 bg-green-500 rounded-full"></div>
                      FT créé ({descentes.filter(d => getDescenteCouleur(d) === 'vert').length})
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="filtre-jaune"
                      checked={showJaune}
                      onChange={(e) => setShowJaune(e.target.checked)}
                      disabled={!showDescentes}
                      className="mr-2 w-4 h-4 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                    />
                    <label htmlFor="filtre-jaune" className="text-sm text-slate-700 cursor-pointer flex items-center">
                      <div className="w-3 h-3 mr-2 bg-yellow-500 rounded-full"></div>
                      Avis émis ({descentes.filter(d => getDescenteCouleur(d) === 'jaune').length})
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="filtre-bleu"
                      checked={showBleu}
                      onChange={(e) => setShowBleu(e.target.checked)}
                      disabled={!showDescentes}
                      className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="filtre-bleu" className="text-sm text-slate-700 cursor-pointer flex items-center">
                      <div className="w-3 h-3 mr-2 bg-blue-500 rounded-full"></div>
                      Paiement complet ({descentes.filter(d => getDescenteCouleur(d) === 'bleu').length})
                    </label>
                  </div>
                </div>

                {/* Statistiques résumées */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    Affichage: {filteredDescentes.length} sur {descentes.length} descentes
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Légende en bas à droite */}
          <div className={`absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-md transition-all duration-300 ${
            showLegend ? 'max-w-[320px] max-h-[70vh]' : 'max-w-[200px]'
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800">Légende</h4>
              <button 
                onClick={() => setShowLegend(!showLegend)}
                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-100 transition-colors"
              >
                {showLegend ? (
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>

            {showLegend && (
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Marqueurs Descentes</h5>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-red-500 rounded-full border-2 border-white shadow-md"></div>
                      <span className="text-xs text-slate-700 flex-1">Descente en cours</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                      <span className="text-xs text-slate-700 flex-1">FT créé ✓</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-yellow-500 rounded-full border-2 border-white shadow-md"></div>
                      <span className="text-xs text-slate-700 flex-1">Avis émis ✓</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
                      <span className="text-xs text-slate-700 flex-1">Paiement Complet ✓</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-purple-500 rounded-full border-2 border-white shadow-md"></div>
                      <span className="text-xs text-slate-700 flex-1">Recherche</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Résultat de recherche */}
          {searchResult && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1001] bg-white p-4 rounded-lg shadow-lg max-w-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-800">
                  Descente Trouvée
                </h4>
                <button
                  onClick={() => {
                    setSearchResult(null);
                    setSearchMarker(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">État :</span>
                  <span className={`font-medium ${
                    searchResult.details?.ft_id && searchResult.details?.avis_id && searchResult.details?.paiement_id
                      ? 'text-blue-600'
                      : searchResult.details?.ft_id && searchResult.details?.avis_id
                      ? 'text-yellow-600'
                      : searchResult.details?.ft_id
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {searchResult.details?.ft_id && searchResult.details?.avis_id && searchResult.details?.paiement_id
                      ? 'Paiement Complet ✓'
                      : searchResult.details?.ft_id && searchResult.details?.avis_id
                      ? 'Avis Émis ✓'
                      : searchResult.details?.ft_id
                      ? 'FT Créé ✓'
                      : 'Descente en cours'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Localité:</span>
                  <span className="text-slate-800">{searchResult.localisation || "Non spécifié"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Commune:</span>
                  <span className="text-slate-800">{searchResult.commune || "Non spécifié"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Verbalisateur:</span>
                  <span className="text-slate-800">{searchResult.verbalisateur || "Non spécifié"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Infraction:</span>
                  <span className="text-slate-800">{searchResult.infraction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Latitude:</span>
                  <span className="text-slate-800">{searchResult.lat?.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Longitude:</span>
                  <span className="text-slate-800">{searchResult.lng?.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Coordonnées Laborde:</span>
                  <span className="text-slate-800">
                    {searchResult.laborde_x?.toFixed(2)}, {searchResult.laborde_y?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </MapContainer>

        {/* Modal de recherche */}
        {showSearchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1002] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Recherche par Coordonnées</h3>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4">
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setSearchType('latlon')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      searchType === 'latlon'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Lat/Lon (WGS84)
                  </button>
                  <button
                    onClick={() => setSearchType('laborde')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      searchType === 'laborde'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Laborde (XY)
                  </button>
                </div>

                {searchType === 'latlon' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ex: -18.8792"
                        value={searchLat}
                        onChange={(e) => setSearchLat(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ex: 47.5079"
                        value={searchLon}
                        onChange={(e) => setSearchLon(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Coordonnée X (Laborde)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ex: 450000"
                        value={searchX}
                        onChange={(e) => setSearchX(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Coordonnée Y (Laborde)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ex: 850000"
                        value={searchY}
                        onChange={(e) => setSearchY(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 mt-6">
                  <button
                    onClick={handleSearch}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Rechercher
                  </button>
                  <button
                    onClick={() => setShowSearchModal(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cartography;
import React, { useEffect, useState, useRef } from "react";
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
import { FaMap, FaSatellite, FaLayerGroup, FaSearch, FaExclamationTriangle, FaDownload, FaFilter } from "react-icons/fa";
import { Package, Filter } from "lucide-react";

// Icône carré rouge pour les markers terrains
const redSquareIcon = new L.DivIcon({
  className: "custom-red-square",
  html: '<div style="width:12px;height:12px;background-color:red;border:1px solid #660000;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6],
});

// Icône pour les remblais
const remblaiIcon = new L.DivIcon({
  className: "custom-remblai-icon",
  html: '<div style="width:12px;height:12px;background-color:red;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.7);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
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

// Fonction utilitaire pour obtenir les informations de style complètes selon les normes internationales
const getCategoryInfo = (category: string) => {
  const categoryLower = category.toLowerCase();
  
  const colorMap = {
    // Zones résidentielles - Dégradé rouge/orange distinct (du clair au foncé, avec contrastes élevés)
    'zone résidentielle à très faible densité': { 
      fillColor: '#FFE0B2',  // Orange clair, visible sur vert/satellite
      color: '#EF6C00',      // Bordure orange foncé
      constructible: true, 
      name: 'Résidentiel Très Faible Densité' 
    },
    'zone résidentielle à faible densité': { 
      fillColor: '#FFCC80',  // Orange moyen
      color: '#E65100',      // Bordure plus intense
      constructible: true, 
      name: 'Résidentiel Faible Densité' 
    },
    'zone résidentielle à moyenne densité': { 
      fillColor: '#FFB74D',  // Orange vif
      color: '#DD2C00',      // Bordure rouge-orangé
      constructible: true, 
      name: 'Résidentiel Moyenne Densité' 
    },
    'zone résidentielle à forte densité': { 
      fillColor: '#FF8A65',  // Rouge-orangé
      color: '#D50000',      // Bordure rouge vif
      constructible: true, 
      name: 'Résidentiel Forte Densité' 
    },
    'zone résidentielle à très forte densité': { 
      fillColor: '#FF7043',  // Rouge intense
      color: '#C2185B',      // Bordure rose-rouge pour distinction
      constructible: true, 
      name: 'Résidentiel Très Forte Densité' 
    },

    // Zones commerciales - Dégradé bleu distinct (clair à foncé, évite confusion avec verts)
    'zone commerciale primaire': { 
      fillColor: '#E1F5FE',  // Bleu très clair
      color: '#0277BD',      // Bordure bleu moyen
      constructible: true, 
      name: 'Commercial Primaire' 
    },
    'corridor commercial': { 
      fillColor: '#B3E5FC',  // Bleu ciel
      color: '#01579B',      // Bordure bleu foncé
      constructible: true, 
      name: 'Corridor Commercial' 
    },

    // Zones industrielles - Dégradé violet/magenta (distinct des bleus et rouges)
    'zone industrielle': { 
      fillColor: '#F3E5F5',  // Violet clair
      color: '#7B1FA2',      // Bordure violet foncé
      constructible: true, 
      name: 'Industriel' 
    },
    'site de décharge et centre d\'enfouissement': { 
      fillColor: '#E1BEE7',  // Violet moyen
      color: '#6A1B9A',      // Bordure magenta-violet
      constructible: true, 
      name: 'Site Décharge' 
    },

    // Équipements publics - Dégradé gris/brun (neutre, distinct des verts)
    'zone d\'équipement public et administratif': { 
      fillColor: '#F5F5F5',  // Gris clair
      color: '#616161',      // Bordure gris moyen
      constructible: true, 
      name: 'Équipement Public' 
    },
    'cimetière': { 
      fillColor: '#D7CCC8',  // Brun clair
      color: '#5D4037',      // Bordure brun foncé
      constructible: false, 
      name: 'Cimetière' 
    },
    'zone militaire': { 
      fillColor: '#BCAAA4',  // Brun moyen
      color: '#4E342E',      // Bordure brun intense
      constructible: false, 
      name: 'Zone Militaire' 
    },

    // Espaces verts et naturels - Dégradé vert (clair à foncé, évite confusion avec bleus)
    'espace vert et parc': { 
      fillColor: '#E8F5E9',  // Vert très clair
      color: '#388E3C',      // Bordure vert moyen
      constructible: false, 
      name: 'Espace Vert' 
    },
    'zone boisée': { 
      fillColor: '#C8E6C9',  // Vert pâle
      color: '#2E7D32',      // Bordure vert foncé
      constructible: false, 
      name: 'Zone Boisée' 
    },
    'zone à pudé': { 
      fillColor: '#A5D6A7',  // Vert moyen
      color: '#1B5E20',      // Bordure vert intense
      constructible: false, 
      name: 'Zone à Pudé' 
    },
    'périmètre de protection': { 
      fillColor: '#81C784',  // Vert émeraude
      color: '#33691E',      // Bordure vert olive
      constructible: false, 
      name: 'Périmètre Protection' 
    },

    // Zones naturelles sensibles - Dégradé turquoise/vert-bleu (distinct des verts purs et bleus)
    'zone humide': { 
      fillColor: '#E0F7FA',  // Turquoise clair
      color: '#0097A7',      // Bordure turquoise moyen
      constructible: false, 
      name: 'Zone Humide' 
    },
    'pente raide': { 
      fillColor: '#B2EBF2',  // Turquoise moyen
      color: '#00838F',      // Bordure cyan foncé
      constructible: false, 
      name: 'Pente Raide' 
    },
    'plan d\'eau': { 
      fillColor: '#80DEEA',  // Turquoise vif
      color: '#006064',      // Bordure bleu-vert intense
      constructible: false, 
      name: 'Plan d\'Eau' 
    },

    // Infrastructures - Dégradé gris (neutre, avec variations pour distinction)
    'voire existante': { 
      fillColor: '#FAFAFA',  // Gris très clair
      color: '#757575',      // Bordure gris moyen
      constructible: true, 
      name: 'Voirie Existante' 
    },
    'zone de développement mixte': { 
      fillColor: '#EEEEEE',  // Gris clair
      color: '#616161',      // Bordure gris foncé
      constructible: true, 
      name: 'Mixte' 
    },
    'zone de développement soumise à un plan d\'aménagement': { 
      fillColor: '#E0E0E0',  // Gris moyen
      color: '#424242',      // Bordure gris anthracite
      constructible: false, 
      name: 'Plan Aménagement' 
    },
  };
  return colorMap[categoryLower] || { 
    fillColor: '#9E9E9E', 
    color: '#424242', 
    constructible: false, 
    name: category 
  };
};

// Fonction pour obtenir le style des prescriptions selon les normes internationales
const getPrescriptionStyle = (feature: any) => {
  const category = feature.properties?.f_category || '';
  const info = getCategoryInfo(category);

  return {
    fillColor: info.fillColor,
    color: info.color,
    weight: 1,
    opacity: 0.9,
    fillOpacity: 0.5,
    dashArray: info.constructible ? null : '5, 5', // Pointillés pour zones non constructibles
  };
};

const Cartography: React.FC = () => {
  const [landData, setLandData] = useState<any[]>([]);
  const [geoJsonLimits, setGeoJsonLimits] = useState<any | null>(null);
  const [cadastreData, setCadastreData] = useState<any | null>(null);
  const [titreRequisitionData, setTitreRequisitionData] = useState<any | null>(null);
  const [demandeFnData, setDemandeFnData] = useState<any | null>(null);
  const [titresSansNomData, setTitresSansNomData] = useState<any | null>(null);
  const [remblais, setRemblais] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any>(null);
  const [searchX, setSearchX] = useState("");
  const [searchY, setSearchY] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchResultType, setSearchResultType] = useState<'terrain' | 'descente' | null>(null);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  
  // États pour contrôler la visibilité des couches
  const [showCadastre, setShowCadastre] = useState(true);
  const [showTitreRequisition, setShowTitreRequisition] = useState(true);
  const [showDemandeFn, setShowDemandeFn] = useState(true);
  const [showTitresSansNom, setShowTitresSansNom] = useState(true);
  const [showLimites, setShowLimites] = useState(true);
  const [showTerrains, setShowTerrains] = useState(true);
  const [showPrescriptions, setShowPrescriptions] = useState(true);
  const [showRemblais, setShowRemblais] = useState(true);

  const mapRef = useRef<L.Map | null>(null);

  // Fonction pour mapper les champs selon différentes conventions de nommage
  const mapRemblaiFields = (item: any) => {
    return {
      id: item.id || item.ID || item.Id || item.record_id || "N/A",
      localite: item.localite || item.localité || item.LOCALITE || item.Localite || "Non spécifié",
      commune: item.commune || item.Commune || item.COMMUNE || "Non spécifié",
      superficie: item.superficie || item.SUPERFICIE || item.surface || item.Surface || "Non spécifié",
      identifica: item.identifica || item.identification || item.IDENTIFICA || item.Identification || "Non spécifié",
      infraction: item.infraction || item.INFRACTION || item.Infraction || "Non spécifié",
      x_coord: item.x_coord || item.X_COORD || item.x || item.coord_x,
      y_coord: item.y_coord || item.Y_COORD || item.y || item.coord_y,
    };
  };

  // Fonction de conversion des coordonnées Madagascar (EPSG:8441) vers WGS84
  const convertMadagascarToWGS84 = (x: number, y: number): [number, number] | [null, null] => {
    const result = proj4("EPSG:8441", "EPSG:4326", [x, y]);
    return [result[1], result[0]]; // proj4 retourne [lng, lat], on veut [lat, lng]
  };

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

  // Remblais et Prescriptions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch remblais
        const resRemblais = await fetch("http://localhost:3000/api/remblai");
        if (!resRemblais.ok) throw new Error(`Erreur HTTP pour remblais: ${resRemblais.status}`);
        const dataRemblais = await resRemblais.json();

        const processedRemblais: any[] = [];
        
        dataRemblais.forEach((item: any, index: number) => {
          const mappedItem = mapRemblaiFields(item);
          
          const x = typeof mappedItem.x_coord === 'string' ? 
            parseFloat(mappedItem.x_coord.replace(',', '.')) : mappedItem.x_coord;
          const y = typeof mappedItem.y_coord === 'string' ? 
            parseFloat(mappedItem.y_coord.replace(',', '.')) : mappedItem.y_coord;
          
          if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y)) {
            return;
          }
          
          const [lat, lng] = convertMadagascarToWGS84(x, y);
          
          if (lat !== null && lng !== null) {
            processedRemblais.push({
              id: mappedItem.id,
              localite: mappedItem.localite,
              commune: mappedItem.commune,
              superficie: mappedItem.superficie,
              identifica: mappedItem.identifica,
              infraction: mappedItem.infraction,
              lat,
              lng,
              _originalXCoord: mappedItem.x_coord,
              _originalYCoord: mappedItem.y_coord,
              _conversionReason: 'Conversion Madagascar → WGS84 réussie'
            });
          }
        });
        
        setRemblais(processedRemblais);

        // Fetch prescriptions
        const prescriptionUrl = "http://localhost:3000/api/prescriptions";
        const resPrescriptions = await fetch(prescriptionUrl);
        if (!resPrescriptions.ok) return;
        const dataPrescriptions = await resPrescriptions.json();

        const fc = {
          type: "FeatureCollection",
          features: dataPrescriptions
            .filter((p: any) => p.geom)
            .map((p: any) => ({
              type: "Feature",
              geometry: typeof p.geom === 'string' ? JSON.parse(p.geom) : p.geom,
              properties: {
                id: p.id,
                category: p.category,
                f_category: p.f_category,
                area: p.area,
                shape_leng: p.shape_leng,
                shape_area: p.shape_area,
              },
            })),
        };
        setPrescriptions(reprojectGeoJSON(fc));

      } catch (error) {
        console.error("Erreur lors du chargement des données", error);
      }
    };
    
    fetchData();
  }, []);

  // Recherche par coordonnées X Y pour terrains ou descentes
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
      
      // Collecter tous les points (terrains et descentes)
      const points = [
        ...landData.map(plot => ({ ...plot, type: 'terrain' as const })),
        ...remblais.map(r => ({ ...r, type: 'descente' as const }))
      ];
      
      // Trouver le point le plus proche (dans un rayon de ~100m)
      let closestPoint = null;
      let minDistance = Infinity;
      
      points.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      });
      
      // Si on a trouvé un point à moins de 0.001 degrés (environ 100m)
      if (closestPoint && minDistance < 0.001) {
        setSearchResult(closestPoint);
        setSearchResultType(closestPoint.type);
        setSearchMarker([lat, lng]);
        
        // Centrer la carte sur le point recherché
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
      } else {
        setSearchResult(null);
        setSearchResultType(null);
        setSearchMarker([lat, lng]);
        alert("Aucun terrain ou descente trouvé à proximité de ces coordonnées.");
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
      <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Descente sur terrain</p>
              <p className="text-2xl font-bold text-red-600">{remblais.length}</p>
            </div>
            <FaLayerGroup className="w-6 h-6 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Prescriptions</p>
              <p className="text-2xl font-bold text-yellow-600">
                {prescriptions?.features?.length || 0}
              </p>
            </div>
            <FaLayerGroup className="w-6 h-6 text-yellow-500" />
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
              </button>
            </div>
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
          ref={mapRef}
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
          <FitBounds data={remblais} />
          {geoJsonLimits && <FitGeoJSONBounds geojson={geoJsonLimits} />}
          {cadastreData && <FitGeoJSONBounds geojson={cadastreData} />}
          {titreRequisitionData && <FitGeoJSONBounds geojson={titreRequisitionData} />}
          {demandeFnData && <FitGeoJSONBounds geojson={demandeFnData} />}
          {titresSansNomData && <FitGeoJSONBounds geojson={titresSansNomData} />}
          {prescriptions && <FitGeoJSONBounds geojson={prescriptions} />}

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

          {/* Markers remblais */}
          {showRemblais && remblais.map((r, i) => (
            <Marker key={i} position={[r.lat, r.lng]} icon={remblaiIcon}>
              <Popup>
                <div className="space-y-2 min-w-[250px]">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium inline-block">
                    Descente
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 border-b pb-2">
                    Remblai #{r.id}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Localité :</strong></div>
                    <div>{r.localite || "Non spécifié"}</div>
                    
                    <div><strong>Commune :</strong></div>
                    <div>{r.commune || "Non spécifié"}</div>
                    
                    <div><strong>Superficie :</strong></div>
                    <div>{r.superficie ? `${r.superficie} m²` : "Non spécifié"}</div>
                    
                    <div><strong>Identification :</strong></div>
                    <div>{r.identifica || "Non spécifié"}</div>
                    
                    <div><strong>Infraction :</strong></div>
                    <div>{r.infraction || "Non spécifié"}</div>
                    
                    <div><strong>Coordonnées X et Y :</strong></div>
                    <div className="text-xs">
                      X: {r._originalXCoord}, Y: {r._originalYCoord}
                    </div>
                    
                    <div><strong>Coordonnées Latlong :</strong></div>
                    <div className="text-xs">
                      {r.lat.toFixed(6)}, {r.lng.toFixed(6)}
                    </div>
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

          {/* Couches GeoJSON pour prescriptions */}
          {showPrescriptions && prescriptions && (
            <GeoJSON
              data={prescriptions}
              style={getPrescriptionStyle}
              onEachFeature={(f, layer) => {
                const info = getCategoryInfo(f.properties.f_category || "");
                layer.bindPopup(`
                  <div class="space-y-2 min-w-[200px]">
                    <h3 class="font-bold text-slate-800">${info.name}</h3>
                    <p><strong>Catégorie:</strong> ${f.properties.f_category || "-"}</p>
                    <p><strong>Surface:</strong> ${f.properties.area || "-"}</p>
                    <p><strong>Type:</strong> <span style="color: ${info.constructible ? 'green' : 'red'}">${info.constructible ? "Constructible" : "Non constructible"}</span></p>
                    <div style="width: 100%; height: 4px; background-color: ${info.fillColor}; margin: 5px 0;"></div>
                  </div>
                `);
              }}
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
              { id: "remblais-toggle", label: "Remblais", checked: showRemblais, onChange: () => setShowRemblais(!showRemblais) },
              { id: "prescriptions-toggle", label: "Prescriptions", checked: showPrescriptions, onChange: () => setShowPrescriptions(!showPrescriptions) },
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

          {/* Légende améliorée avec header et bouton de contrôle */}
          <div className={`absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-md transition-all duration-300 ${showLegend ? 'max-w-[320px] max-h-[70vh]' : 'max-w-[200px]'}`}>
            {/* Header de la légende avec bouton de réduction */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800">Légende Normalisée</h4>
              <button 
                onClick={() => setShowLegend(!showLegend)}
                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-100 transition-colors"
                title={showLegend ? "Réduire la légende" : "Développer la légende"}
              >
                {showLegend ? (
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Contenu de la légende (seulement visible quand développé) */}
            {showLegend && (
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {/* Légende générale */}
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Marqueurs</h5>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3" style={{ 
                        backgroundColor: "red",
                        borderRadius: '50%',
                        border: '2px solid white',
                        boxShadow: '0 0 8px rgba(0,0,0,0.7)'
                      }}></div>
                      <span className="text-xs text-slate-700 flex-1">Descente sur terrain</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3" style={{ 
                        backgroundColor: "blue",
                        borderRadius: '50%',
                        border: '2px solid white',
                        boxShadow: '0 0 8px rgba(0,0,0,0.7)'
                      }}></div>
                      <span className="text-xs text-slate-700 flex-1">Recherche</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-red-500 border border-red-700"></div>
                      <span className="text-xs text-slate-700 flex-1">Terrains</span>
                    </div>
                  </div>
                </div>

                {/* Légende des couches */}
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Couches</h5>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-1 mr-3 bg-red-500"></div>
                      <span className="text-xs text-slate-700 flex-1">Limites</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-blue-500"></div>
                      <span className="text-xs text-slate-700 flex-1">Cadastre</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-green-500"></div>
                      <span className="text-xs text-slate-700 flex-1">Titre Réquisition</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-orange-500"></div>
                      <span className="text-xs text-slate-700 flex-1">Demande FN</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-3 bg-purple-500"></div>
                      <span className="text-xs text-slate-700 flex-1">Titres Sans Nom</span>
                    </div>
                  </div>
                </div>

                {/* Légende des prescriptions par catégories */}
                <div className="border-t pt-3">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Prescriptions</h5>
                  
                  {/* Zones résidentielles */}
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-slate-600 mb-1">Résidentiel</h6>
                    <div className="space-y-1 ml-2">
                      {['zone résidentielle à très faible densité', 'zone résidentielle à faible densité', 
                        'zone résidentielle à moyenne densité', 'zone résidentielle à forte densité',
                        'zone résidentielle à très forte densité'].map((category: any) => {
                        const info = getCategoryInfo(category);
                        return (
                          <div key={category} className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 border border-gray-300"
                              style={{ backgroundColor: info.fillColor }}
                            ></div>
                            <span className="text-xs text-slate-700 flex-1 truncate" title={info.name}>
                              {info.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Zones commerciales */}
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-slate-600 mb-1">Commercial</h6>
                    <div className="space-y-1 ml-2">
                      {['zone commerciale primaire', 'corridor commercial'].map((category: any) => {
                        const info = getCategoryInfo(category);
                        return (
                          <div key={category} className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 border border-gray-300"
                              style={{ backgroundColor: info.fillColor }}
                            ></div>
                            <span className="text-xs text-slate-700 flex-1 truncate" title={info.name}>
                              {info.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Zones industrielles */}
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-slate-600 mb-1">Industriel</h6>
                    <div className="space-y-1 ml-2">
                      {['zone industrielle', 'site de décharge et centre d\'enfouissement'].map((category: any) => {
                        const info = getCategoryInfo(category);
                        return (
                          <div key={category} className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 border border-gray-300"
                              style={{ backgroundColor: info.fillColor }}
                            ></div>
                            <span className="text-xs text-slate-700 flex-1 truncate" title={info.name}>
                              {info.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Espaces verts et naturels */}
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-slate-600 mb-1">Nature & Environnement</h6>
                    <div className="space-y-1 ml-2">
                      {['espace vert et parc', 'zone boisée', 'zone à pudé', 'périmètre de protection',
                        'zone humide', 'pente raide', 'plan d\'eau'].map((category: any) => {
                        const info = getCategoryInfo(category);
                        return (
                          <div key={category} className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 border border-gray-300"
                              style={{ backgroundColor: info.fillColor }}
                            ></div>
                            <span className="text-xs text-slate-700 flex-1 truncate" title={info.name}>
                              {info.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Équipements publics */}
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-slate-600 mb-1">Équipements Publics</h6>
                    <div className="space-y-1 ml-2">
                      {['zone d\'équipement public et administratif', 'cimetière', 'zone militaire'].map((category: any) => {
                        const info = getCategoryInfo(category);
                        return (
                          <div key={category} className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 border border-gray-300"
                              style={{ backgroundColor: info.fillColor }}
                            ></div>
                            <span className="text-xs text-slate-700 flex-1 truncate" title={info.name}>
                              {info.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Infrastructures */}
                  <div className="mb-2">
                    <h6 className="text-xs font-medium text-slate-600 mb-1">Infrastructures</h6>
                    <div className="space-y-1 ml-2">
                      {['voire existante', 'zone de développement mixte', 'zone de développement soumise à un plan d\'aménagement'].map((category: any) => {
                        const info = getCategoryInfo(category);
                        return (
                          <div key={category} className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 border border-gray-300"
                              style={{ backgroundColor: info.fillColor }}
                            ></div>
                            <span className="text-xs text-slate-700 flex-1 truncate" title={info.name}>
                              {info.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Version réduite de la légende */}
            {!showLegend && (
              <div className="p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 mr-2 bg-red-500 border border-red-700"></div>
                  <div className="w-3 h-3 mr-2 bg-blue-500"></div>
                  <div className="w-3 h-3 bg-green-500"></div>
                </div>
                <span className="text-xs text-slate-600">Légende réduite</span>
              </div>
            )}
          </div>

          {/* Résultat de recherche */}
          {searchResult && (
            <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-md max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-800">{searchResultType === 'terrain' ? 'Terrain Trouvé' : 'Descente Trouvée'}</h4>
                <button 
                  onClick={() => { setSearchResult(null); setSearchResultType(null); }} 
                  className="text-slate-500 hover:text-slate-700"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {searchResultType === 'terrain' ? (
                  <>
                    <p><strong>Propriétaire:</strong> {searchResult.PROPRIETAIRE}</p>
                    <p><strong>Commune:</strong> {searchResult.COMMUNE}</p>
                    <p><strong>Fokontany:</strong> {searchResult.FOKONTANY || "?"}</p>
                    <p><strong>Localisation:</strong> {searchResult.LOCALISATION || "?"}</p>
                    <p><strong>ID:</strong> {searchResult.IDENTIFICATION_DU_TERRAIN_parcelle_cadastrale_TITLE || "?"}</p>
                    <p><strong>Superficie:</strong> {searchResult.SUPERFICIE_TERRAIN_m} m²</p>
                  </>
                ) : (
                  <>
                    <p><strong>Localité:</strong> {searchResult.localite || "Non spécifié"}</p>
                    <p><strong>Commune:</strong> {searchResult.commune || "Non spécifié"}</p>
                    <p><strong>Superficie:</strong> {searchResult.superficie ? `${searchResult.superficie} m²` : "Non spécifié"}</p>
                    <p><strong>Identification:</strong> {searchResult.identifica || "Non spécifié"}</p>
                    <p><strong>Infraction:</strong> {searchResult.infraction || "Non spécifié"}</p>
                    <p><strong>Coordonnées X/Y:</strong> {searchResult._originalXCoord}, {searchResult._originalYCoord}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default Cartography;
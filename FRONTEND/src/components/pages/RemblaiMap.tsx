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
import { FaSearch, FaLayerGroup, FaSatellite, FaMap, FaExclamationTriangle, FaDownload, FaFilter } from "react-icons/fa";

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
  html: '<div style="width:12px;height:12px;background-color:blue;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(0,0,0,0.7);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

// Définition projection EPSG:8441 (Laborde Madagascar)
proj4.defs(
  "EPSG:8441",
  "+proj=omerc +lat_0=-18.9 +lonc=46.43722916666667 +alpha=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +towgs84=-189,-242,-91,0,0,0,0 +units=m +no_defs"
);

// Fonction pour reprojeter un GeoJSON
const reprojectGeoJSON = (geojson: any) => {
  const fromProj = "EPSG:8441";
  const toProj = "EPSG:4326";

  if (!proj4.defs(fromProj) || !geojson?.features || !Array.isArray(geojson.features)) return geojson;

  const newGeo = JSON.parse(JSON.stringify(geojson));

  const reprojectCoords = (coords: any[]): any[] => {
    if (!coords) return coords;
    if (typeof coords[0] === "number") {
      const [x, y] = coords;
      return proj4(fromProj, toProj, [x, y]);
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
    const layer = L.geoJSON(geojson);
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    else map.setView([-18.8792, 47.5079], 6);
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

// Interface pour les données invalides
interface InvalidDataItem {
  id: string | number;
  originalIndex: number;
  x_coord?: string | number;
  y_coord?: string | number;
  commune?: string;
  localite?: string;
  reason?: string;
}

interface InvalidDataTableProps {
  invalidData: InvalidDataItem[];
  totalRecords: number;
  onSaveEdit: (editedItem: InvalidDataItem) => void;
}

// Composant Tableau des données invalides
const InvalidDataTable: React.FC<InvalidDataTableProps> = ({ invalidData, totalRecords, onSaveEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterReason, setFilterReason] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editedData, setEditedData] = useState<Partial<InvalidDataItem>>({});

  // Filtrer les données par raison
  const filteredData = filterReason
    ? invalidData.filter(item => item.reason?.toLowerCase().includes(filterReason.toLowerCase()))
    : invalidData;

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Fonction pour démarrer l'édition
  const startEditing = (item: InvalidDataItem) => {
    setEditingId(item.id);
    setEditedData({ ...item });
  };

  // Fonction pour annuler l'édition
  const cancelEditing = () => {
    setEditingId(null);
    setEditedData({});
  };

  // Fonction pour sauvegarder les modifications
  const saveEditing = () => {
    if (editingId) {
      onSaveEdit({ ...editedData, id: editingId } as InvalidDataItem);
    }
    setEditingId(null);
    setEditedData({});
  };

  // Fonction pour mettre à jour les champs édités
  const handleFieldChange = (field: keyof InvalidDataItem, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  // Télécharger les données en CSV
  const downloadCSV = () => {
    const headers = ["ID", "Index", "X_Coord", "Y_Coord", "Commune", "Localité", "Raison"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(item => [
        item.id,
        item.originalIndex,
        `"${item.x_coord ?? ""}"`,
        `"${item.y_coord ?? ""}"`,
        `"${item.commune ?? ""}"`,
        `"${item.localite ?? ""}"`,
        `"${item.reason ?? ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "donnees_invalides.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistiques par type d'erreur
  const errorStats = invalidData.reduce((acc, item) => {
    const reason = item.reason || "Inconnue";
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FaExclamationTriangle className="text-yellow-500 mr-2" />
            Données Invalides
          </h2>
          <p className="text-slate-600 mt-1">
            {invalidData.length} données invalides sur {totalRecords} total 
            ({((invalidData.length / totalRecords) * 100).toFixed(1)}%)
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 lg:mt-0">
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaDownload className="w-4 h-4" />
            <span>Télécharger CSV</span>
          </button>
        </div>
      </div>

      {/* Statistiques des erreurs */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg">
        <h3 className="font-semibold text-slate-700 mb-3">Répartition des erreurs :</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(errorStats).map(([reason, count]) => (
            <div key={reason} className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="text-sm text-slate-700 truncate" title={reason}>
                {reason}
              </span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <FaFilter className="text-slate-500" />
          <span className="text-sm text-slate-700">Filtrer par raison :</span>
        </div>
        <input
          type="text"
          placeholder="Rechercher une raison..."
          value={filterReason}
          onChange={(e) => setFilterReason(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
        
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={10}>10 lignes</option>
          <option value={25}>25 lignes</option>
          <option value={50}>50 lignes</option>
          <option value={100}>100 lignes</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Index
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                X_Coord
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Y_Coord
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Commune
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Localité
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Raison
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-slate-500">
                  {filterReason ? "Aucune donnée ne correspond à votre filtre" : "Aucune donnée invalide"}
                </td>
              </tr>
            ) : (
              currentItems.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {item.id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                    {item.originalIndex}
                  </td>
                  
                  {/* X_Coord avec édition */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editedData.x_coord ?? ""}
                        onChange={(e) => handleFieldChange('x_coord', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      `"${item.x_coord ?? "NULL"}"`
                    )}
                  </td>
                  
                  {/* Y_Coord avec édition */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editedData.y_coord ?? ""}
                        onChange={(e) => handleFieldChange('y_coord', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      `"${item.y_coord ?? "NULL"}"`
                    )}
                  </td>
                  
                  {/* Commune avec édition */}
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editedData.commune ?? ""}
                        onChange={(e) => handleFieldChange('commune', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      item.commune ?? "Non spécifié"
                    )}
                  </td>
                  
                  {/* Localité avec édition */}
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editedData.localite ?? ""}
                        onChange={(e) => handleFieldChange('localite', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      item.localite ?? "Non spécifié"
                    )}
                  </td>
                  
                  <td className="px-4 py-4 text-sm text-red-600 max-w-xs truncate" title={item.reason}>
                    {item.reason}
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === item.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEditing}
                          className="text-green-600 hover:text-green-800"
                          title="Sauvegarder"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-600 hover:text-red-800"
                          title="Annuler"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(item)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-700">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredData.length)} 
            sur {filteredData.length} résultats
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
            >
              Précédent
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === page
                      ? "bg-blue-500 text-white border-blue-500"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface RemblaiMapProps {
  apiUrl: string;
}

const RemblaiMap: React.FC<RemblaiMapProps> = ({ apiUrl }) => {
  const [remblais, setRemblais] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchX, setSearchX] = useState("");
  const [searchY, setSearchY] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(true);
  const [showInvalidTable, setShowInvalidTable] = useState(false);
  const [invalidData, setInvalidData] = useState<InvalidDataItem[]>([]);
  const [showRemblais, setShowRemblais] = useState(true);

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

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = (editedItem: InvalidDataItem) => {
    // Mettre à jour les données invalides
    setInvalidData(prev => 
      prev.map(item => 
        item.id === editedItem.id ? editedItem : item
      )
    );
    
    // Valider après édition
    validateDataAfterEdit(editedItem);
  };

  // Fonction pour valider les données après édition
  const validateDataAfterEdit = (editedItem: InvalidDataItem) => {
    const x = typeof editedItem.x_coord === 'string' ? 
      parseFloat(editedItem.x_coord.replace(',', '.')) : editedItem.x_coord;
    const y = typeof editedItem.y_coord === 'string' ? 
      parseFloat(editedItem.y_coord.replace(',', '.')) : editedItem.y_coord;
    
    if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
      const [lat, lng] = convertMadagascarToWGS84(x, y);
      
      if (lat !== null && lng !== null) {
        // Les données sont maintenant valides, les déplacer vers remblais
        const validItem = {
          ...editedItem,
          lat,
          lng,
          _originalXCoord: editedItem.x_coord,
          _originalYCoord: editedItem.y_coord,
          _conversionReason: 'Conversion Madagascar → WGS84 réussie après édition'
        };
        
        setRemblais(prev => [...prev, validItem]);
        setInvalidData(prev => prev.filter(item => item.id !== editedItem.id));
      }
    }
  };

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch remblais
        const resRemblais = await fetch(apiUrl);
        if (!resRemblais.ok) throw new Error(`Erreur HTTP pour remblais: ${resRemblais.status}`);
        const dataRemblais = await resRemblais.json();

        const processedRemblais: any[] = [];
        const invalidEntries: InvalidDataItem[] = [];
        
        dataRemblais.forEach((item: any, index: number) => {
          const mappedItem = mapRemblaiFields(item);
          
          const x = typeof mappedItem.x_coord === 'string' ? 
            parseFloat(mappedItem.x_coord.replace(',', '.')) : mappedItem.x_coord;
          const y = typeof mappedItem.y_coord === 'string' ? 
            parseFloat(mappedItem.y_coord.replace(',', '.')) : mappedItem.y_coord;
          
          if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y)) {
            invalidEntries.push({
              id: mappedItem.id,
              originalIndex: index,
              x_coord: mappedItem.x_coord,
              y_coord: mappedItem.y_coord,
              commune: mappedItem.commune,
              localite: mappedItem.localite,
              reason: `Coordonnées non numériques: X=${mappedItem.x_coord}, Y=${mappedItem.y_coord}`
            });
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
          } else {
            invalidEntries.push({
              id: mappedItem.id,
              originalIndex: index,
              x_coord: mappedItem.x_coord,
              y_coord: mappedItem.y_coord,
              commune: mappedItem.commune,
              localite: mappedItem.localite,
              reason: 'Échec de la conversion des coordonnées'
            });
          }
        });
        
        setRemblais(processedRemblais);
        setInvalidData(invalidEntries);

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
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [apiUrl]);

  // Recherche par coordonnées
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const x = parseFloat(searchX);
    const y = parseFloat(searchY);
    
    if (isNaN(x) || isNaN(y)) {
      alert("Coordonnées X Y invalides");
      return;
    }

    const [lat, lng] = convertMadagascarToWGS84(x, y);
    
    if (lat === null || lng === null) {
      alert("Erreur lors de la conversion des coordonnées de recherche");
      return;
    }
    
    // Trouver le remblai le plus proche
    let closestRemblai = null;
    let minDistance = Infinity;
    
    remblais.forEach(remblai => {
      const distance = Math.sqrt(
        Math.pow(remblai.lat - lat, 2) + 
        Math.pow(remblai.lng - lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestRemblai = remblai;
      }
    });
    
    // Si on a trouvé un remblai à moins de 0.001 degrés (environ 100m)
    if (closestRemblai && minDistance < 0.001) {
      setSearchResult(closestRemblai);
    } else {
      setSearchResult(null);
    }
    
    setSearchMarker([lat, lng]);
  };

  // Liste des catégories pour la légende
  const getCategoryList = () => {
    if (!prescriptions?.features) return [];
    
    const categories = new Set();
    prescriptions.features.forEach((feature: any) => {
      if (feature.properties?.f_category) {
        categories.add(feature.properties.f_category);
      }
    });
    
    return Array.from(categories).sort();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center" style={{ height: "70vh" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des remblais...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center" style={{ height: "70vh" }}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Erreur</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Cartographie des Remblais</h1>
          <p className="text-slate-600 mt-1">Visualisation des données géospatiales</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Remblais</p>
              <p className="text-2xl font-bold text-slate-800">{remblais.length}</p>
            </div>
            <FaLayerGroup className="w-8 h-8 text-blue-500" />
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
            <form onSubmit={handleSearch} className="flex space-x-2">
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="Coordonnée X"
                  value={searchX}
                  onChange={(e) => setSearchX(e.target.value)}
                  className="pl-3 pr-4 py-2 w-32 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="Coordonnée Y"
                  value={searchY}
                  onChange={(e) => setSearchY(e.target.value)}
                  className="pl-3 pr-4 py-2 w-32 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button 
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaSearch className="w-4 h-4" />
                <span>Rechercher</span>
              </button>
            </form>
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

            <button
              onClick={() => setShowInvalidTable(!showInvalidTable)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showInvalidTable
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FaExclamationTriangle className="w-4 h-4" />
              <span>{showInvalidTable ? 'Masquer tableau' : 'Afficher tableau'}</span>
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
          <FitBounds data={remblais} />
          {prescriptions && <FitGeoJSONBounds geojson={prescriptions} />}

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
                  <p><strong>Coordonnées WGS84:</strong> {searchMarker[0].toFixed(6)}, {searchMarker[1].toFixed(6)}</p>
                  <p><strong>Coordonnées X/Y:</strong> {searchX}, {searchY}</p>
                </div>
              </Popup>
            </Marker>
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

          {/* Légende normalisée internationale */}
          <div className="absolute bottom-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-md max-w-[320px] max-h-[70vh] overflow-y-auto">
            <h4 className="mb-3 font-bold text-slate-800">Légende Normalisée (Normes Internationales)</h4>
            
            {/* Légende générale */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 mr-2" style={{ 
                  backgroundColor: "red",
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 0 8px rgba(0,0,0,0.7)'
                }}></div>
                <span className="text-xs text-slate-700">Remblais</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 mr-2" style={{ 
                  backgroundColor: "blue",
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 0 8px rgba(0,0,0,0.7)'
                }}></div>
                <span className="text-xs text-slate-700">Recherche</span>
              </div>
            </div>

            {/* Légende par catégories normalisées */}
            <div className="border-t pt-3">
              <div className="mb-2">
                {['zone résidentielle à très faible densité', 'zone résidentielle à faible densité', 
                  'zone résidentielle à moyenne densité', 'zone résidentielle à forte densité',
                  'zone résidentielle à très forte densité'].map((category: any) => {
                  const info = getCategoryInfo(category);
                  return (
                    <div key={category} className="flex items-center mb-1 ml-2">
                      <div 
                        className="w-3 h-3 mr-2 border border-gray-300"
                        style={{ backgroundColor: info.fillColor }}
                      ></div>
                      <span className="text-xs text-slate-700 flex-1 truncate">
                        {info.code}: {info.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Zones commerciales */}
              <div className="mb-2">
                {['zone commerciale primaire', 'corridor commercial'].map((category: any) => {
                  const info = getCategoryInfo(category);
                  return (
                    <div key={category} className="flex items-center mb-1 ml-2">
                      <div 
                        className="w-3 h-3 mr-2 border border-gray-300"
                        style={{ backgroundColor: info.fillColor }}
                      ></div>
                      <span className="text-xs text-slate-700 flex-1 truncate">
                        {info.code}: {info.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Zones industrielles */}
              <div className="mb-2">
                {['zone industrielle', 'site de décharge et centre d\'enfouissement'].map((category: any) => {
                  const info = getCategoryInfo(category);
                  return (
                    <div key={category} className="flex items-center mb-1 ml-2">
                      <div 
                        className="w-3 h-3 mr-2 border border-gray-300"
                        style={{ backgroundColor: info.fillColor }}
                      ></div>
                      <span className="text-xs text-slate-700 flex-1 truncate">
                        {info.code}: {info.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mb-2">
                {['espace vert et parc', 'zone boisée', 'zone à pudé', 'périmètre de protection',
                  'zone humide', 'pente raide', 'plan d\'eau'].map((category: any) => {
                  const info = getCategoryInfo(category);
                  return (
                    <div key={category} className="flex items-center mb-1 ml-2">
                      <div 
                        className="w-3 h-3 mr-2 border border-gray-300"
                        style={{ backgroundColor: info.fillColor }}
                      ></div>
                      <span className="text-xs text-slate-700 flex-1 truncate">
                        {info.code}: {info.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Équipements publics */}
              <div className="mb-2">
                {['zone d\'équipement public et administratif', 'cimetière', 'zone militaire'].map((category: any) => {
                  const info = getCategoryInfo(category);
                  return (
                    <div key={category} className="flex items-center mb-1 ml-2">
                      <div 
                        className="w-3 h-3 mr-2 border border-gray-300"
                        style={{ backgroundColor: info.fillColor }}
                      ></div>
                      <span className="text-xs text-slate-700 flex-1 truncate">
                        {info.code}: {info.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Infrastructures */}
              <div className="mb-2">
                {['voire existante', 'zone de développement mixte', 'zone de développement soumise à un plan d\'aménagement'].map((category: any) => {
                  const info = getCategoryInfo(category);
                  return (
                    <div key={category} className="flex items-center mb-1 ml-2">
                      <div 
                        className="w-3 h-3 mr-2 border border-gray-300"
                        style={{ backgroundColor: info.fillColor }}
                      ></div>
                      <span className="text-xs text-slate-700 flex-1 truncate">
                        {info.code}: {info.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Résultat de recherche */}
          {searchResult && (
            <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-md max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-800">Remblai Trouvé</h4>
                <button 
                  onClick={() => setSearchResult(null)} 
                  className="text-slate-500 hover:text-slate-700"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {searchResult.id}</p>
                <p><strong>Localité:</strong> {searchResult.localite || "Non spécifié"}</p>
                <p><strong>Commune:</strong> {searchResult.commune || "Non spécifié"}</p>
                <p><strong>Superficie:</strong> {searchResult.superficie ? `${searchResult.superficie} m³` : "Non spécifié"}</p>
                <p><strong>Identification:</strong> {searchResult.identifica || "Non spécifié"}</p>
                <p><strong>Coordonnées WGS84:</strong> {searchResult.lat.toFixed(6)}, {searchResult.lng.toFixed(6)}</p>
              </div>
            </div>
          )}
        </MapContainer>
      </div>

      {/* Tableau des données invalides */}
      {showInvalidTable && (
        <InvalidDataTable 
          invalidData={invalidData} 
          totalRecords={remblais.length + invalidData.length}
          onSaveEdit={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default RemblaiMap;
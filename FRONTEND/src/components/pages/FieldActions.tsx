import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, FeatureGroup, LayersControl, useMapEvents } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import * as turf from "@turf/turf";
import { 
  Plus, Search, User, MapPin, Home, Tag, ArrowRight, DollarSign, 
  AlertTriangle, Globe, Edit, Eye, Clock, CheckCircle, AlertCircle, 
  X, ChevronLeft, ChevronRight, Calendar 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import axios from 'axios';

// Fix icône Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Gestion du clic sur la carte
function MapClickHandler({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({ click: e => onMapClick(e.latlng) });
  return null;
}

interface Descente {
  date_desce: string; // Changé à string pour correspondre à votre utilisation de formatDate
  actions: string;
  actions_su: string;
  commune: string;
  localite: string;
  identifica: string;
  x_coord: number;
  y_coord: number;
  superficie: number;
  infraction: string;
}

// Définition de l'état initial du formulaire
const initialFormData = {
  proprietaire: "",
  commune: "",
  fokontany: "",
  localisation: "",
  identification: "",
  X_coord: 0,
  Y_coord: 0,
  superficie: 0,
  infraction: "",
  destination: "",
  montant: 0,
  actions: [] as string[],
  modelePV: "PAT",
  situation: "",
  polygonCoords: [] as [number, number][],
};

const FieldActionsMap: React.FC = () => {
  const mapRef = useRef<L.Map>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  
  const [formData, setFormData] = useState(initialFormData);

  const [listeDescentes, setListeDescentes] = useState<Descente[]>([]);
  const [searchCoords, setSearchCoords] = useState({ x: "", y: "" });
  const [searchError, setSearchError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDescente, setSelectedDescente] = useState<Descente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Chargement des données de descente (inchangé)
  useEffect(() => {
    const fetchDescentes = async () => {
      try {
        console.log("🔄 Chargement des données de descente...");
        const response = await axios.get("http://localhost:3000/api/descentes");
        
        console.log("✅ Réponse API reçue:", response.data);

        let data = response.data;

        // Normalisation des données
        if (!Array.isArray(data)) {
          console.warn("⚠️ La réponse n'est pas un tableau, tentative de conversion...");
          if (data && typeof data === 'object') {
            const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
            data = arrayKey ? data[arrayKey] : [data];
          } else {
            data = [];
          }
        }

        if (Array.isArray(data)) {
          setListeDescentes(data);
          console.log(`✅ ${data.length} descentes chargées avec succès`);
        } else {
          throw new Error("Format de données invalide");
        }

      } catch (err: any) {
        console.error("❌ Erreur de chargement:", err);
        let errorMessage = "Erreur lors du chargement des données";

        if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
          errorMessage = "Impossible de se connecter au serveur. Vérifiez que le serveur est démarré sur le port 3000.";
        } else if (err.response?.status === 404) {
          errorMessage = "Endpoint non trouvé. Vérifiez la route /api/descentes.";
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }

        setError(errorMessage);
        setListeDescentes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDescentes();
  }, []);

  // Fonctions de gestion du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      actions: checked 
        ? [...prev.actions, name] 
        : prev.actions.filter(action => action !== name)
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, modelePV: e.target.value });
  };

  const handlePolygonCreated = (e: any) => {
    const layer = e.layer;
    const latlngs = layer.getLatLngs()[0].map((p: any) => [p.lng, p.lat]);
    const polygon = turf.polygon([[...latlngs, latlngs[0]]]);
    const area = turf.area(polygon);
    setFormData({ ...formData, polygonCoords: latlngs, superficie: area });

    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((l: any) => {
        if (l !== layer) featureGroupRef.current.removeLayer(l);
      });
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
    console.log("Clic sur la carte:", latlng);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchCoords(prev => ({ ...prev, [name]: value }));
    setSearchError("");
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const x = parseFloat(searchCoords.x);
    const y = parseFloat(searchCoords.y);
    if (isNaN(x) || isNaN(y)) {
      setSearchError("Veuillez entrer des coordonnées valides");
      return;
    }
    if (mapRef.current) mapRef.current.setView([x, y], 15);
  };

  // NOUVELLE FONCTION: Réinitialiser le formulaire (et la carte)
  const resetForm = () => {
    setFormData(initialFormData);
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
  };

  // NOUVELLE FONCTION: Gestion de la soumission du formulaire
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log("💾 Soumission du formulaire:", formData);
    
    alert("Formulaire soumis avec succès (voir console pour les données) !");
    resetForm(); 
    setShowForm(false); 
  };


  // Fonctions utilitaires (inchangées)
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'Non spécifié';
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getStatusColor = (actions: string) => {
    if (!actions) return 'bg-slate-100 text-slate-700';
    const actionsLower = String(actions).toLowerCase();
    
    if (actionsLower.includes('résolu') || actionsLower.includes('resolu')) {
      return 'bg-green-100 text-green-700';
    } else if (actionsLower.includes('en cours')) {
      return 'bg-blue-100 text-blue-700';
    } else if (actionsLower.includes('en attente')) {
      return 'bg-yellow-100 text-yellow-700';
    } else if (actionsLower.includes('urgent')) {
      return 'bg-red-100 text-red-700';
    } else {
      return 'bg-slate-100 text-slate-700';
    }
  };

  // Filtrage et pagination (inchangés)
  const filteredDescentes = listeDescentes.filter(descente => {
    const statusMatch = activeTab === 'all' || 
      (descente.actions && String(descente.actions).toLowerCase().includes(activeTab));

    const searchMatch = searchTerm === '' || 
      (descente.commune && String(descente.commune).toLowerCase().includes(searchTerm.toLowerCase())) || 
      (descente.localite && String(descente.localite).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (descente.identifica && String(descente.identifica).toLowerCase().includes(searchTerm.toLowerCase()));

    return statusMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredDescentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDescentes = filteredDescentes.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewClick = (descente: Descente) => {
    setSelectedDescente(descente);
    setShowModal(true);
  };

  // Statistiques (inchangées)
  const getStatsCount = (condition: (d: Descente) => boolean) => {
    return listeDescentes.filter(condition).length;
  };

  return (
    <div className="space-y-6 min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Descentes sur le terrain</h1>
          <p className="text-gray-600 mt-1">Suivi des descentes et infractions constatées</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            // Réinitialiser le formulaire si on l'ouvre
            if (!showForm) {
              resetForm();
            }
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Masquer le formulaire' : 'Nouvelle descente'}</span>
        </button>
      </div>

      {/* Statistiques (inchangées) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total descentes</p>
              <p className="text-2xl font-bold text-gray-900">{listeDescentes.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {getStatsCount(d => d.actions && String(d.actions).toLowerCase().includes('en attente'))}
              </p>
              </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">En cours</p>
              <p className="text-2xl font-bold text-orange-600">
                {getStatsCount(d => d.actions && String(d.actions).toLowerCase().includes('en cours'))}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Résolus</p>
              <p className="text-2xl font-bold text-green-600">
                {getStatsCount(d => d.actions && String(d.actions).toLowerCase().includes('résolu'))}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

       {/* Formulaire (inchangé sauf pour l'appel à handleSubmit) */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Nouvelle Action</h2>
          <form onSubmit={handleSubmit} className="space-y-6"> {/* handleSubmit est maintenant défini */}
            {/* Actions et Modèle PV */}
            <div className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Actions</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" name="depotPv" checked={formData.actions.includes("depotPv")} onChange={handleCheckboxChange} className="form-checkbox text-blue-500 rounded" />
                    <span>Dépôt PV</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" name="arretInteractif" checked={formData.actions.includes("arretInteractif")} onChange={handleCheckboxChange} className="form-checkbox text-blue-500 rounded" />
                    <span>Arrêt interactif des travaux</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" name="nonRespect" checked={formData.actions.includes("nonRespect")} onChange={handleCheckboxChange} className="form-checkbox text-blue-500 rounded" />
                    <span>Non-respect de l'arrêt interactif</span>
                  </label>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Modèle PV</p>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="modelePV" value="PAT" checked={formData.modelePV === "PAT"} onChange={handleRadioChange} className="form-radio text-blue-500" />
                    <span>PAT</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="modelePV" value="FIFAFI" checked={formData.modelePV === "FIFAFI"} onChange={handleRadioChange} className="form-radio text-blue-500" />
                    <span>FIFAFI</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Propriétaire</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" name="proprietaire" placeholder="Propriétaire" value={formData.proprietaire} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commune</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" name="commune" placeholder="Commune" value={formData.commune} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fokontany</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" name="fokontany" placeholder="Fokontany" value={formData.fokontany} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localisation</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" name="localisation" placeholder="Localisation" value={formData.localisation} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Identification du terrain</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" name="identification" placeholder="Identification du terrain" value={formData.identification} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                <div className="relative">
                  <ArrowRight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" name="destination" placeholder="Destination" value={formData.destination} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coordonnée X (Latitude)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="number" step="any" name="X_coord" placeholder="Coordonnée X (Latitude)" value={formData.X_coord === 0 ? "" : formData.X_coord} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coordonnée Y (Longitude)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="number" step="any" name="Y_coord" placeholder="Coordonnée Y (Longitude)" value={formData.Y_coord === 0 ? "" : formData.Y_coord} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Montant amende (Ar)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="number" name="montant" placeholder="Montant amende (Ar)" value={formData.montant === 0 ? "" : formData.montant} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Situation</label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" name="situation" placeholder="Situation" value={formData.situation} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Infractions constatées</label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <textarea name="infraction" placeholder="Infractions constatées" value={formData.infraction} onChange={handleInputChange} rows={3} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            {/* Carte */}
            <div className="bg-slate-50 p-4 rounded-lg shadow-inner">
              <h3 className="text-lg font-medium text-slate-700 mb-4">Délimitation du terrain sur la carte</h3>
              <div className="h-[60vh] relative mb-4 rounded-lg overflow-hidden">
                <MapContainer
                  center={[-18.8792, 47.5079]}
                  zoom={13}
                  minZoom={3}
                  maxZoom={22}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                  ref={mapRef}
                >
                  <MapClickHandler onMapClick={handleMapClick} />
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="OpenStreetMap">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={22} />
                    </LayersControl.BaseLayer>
                  </LayersControl>
                  <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                      position="topright"
                      onCreated={handlePolygonCreated}
                      draw={{ rectangle: false, circle: false, marker: false, circlemarker: false, polyline: false }}
                    />
                  </FeatureGroup>
                </MapContainer>

                {/* Recherche */}
                <div className="absolute top-3 left-3 z-[1000] p-3 bg-white rounded-lg shadow-md border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2 text-center">Recherche par coordonnées</p>
                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <input type="text" name="x" placeholder="Lat" value={searchCoords.x} onChange={handleSearchChange} className="w-20 text-xs px-2 py-1 border border-slate-300 rounded-md focus:outline-none" />
                    <input type="text" name="y" placeholder="Lon" value={searchCoords.y} onChange={handleSearchChange} className="w-20 text-xs px-2 py-1 border border-slate-300 rounded-md focus:outline-none" />
                    <button type="submit" className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                      <Search className="w-4 h-4" />
                    </button>
                  </form>
                  {searchError && <p className="text-red-500 text-xs mt-1">{searchError}</p>}
                </div>
              </div>

              {/* Superficie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Superficie (m²)</label>
                  <input type="text" placeholder="Superficie (m²)" value={formData.superficie.toFixed(2)} readOnly className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Superficie (ha)</label>
                  <input type="text" placeholder="Superficie (ha)" value={(formData.superficie / 10000).toFixed(4)} readOnly className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Matrice des coordonnées du polygone (lng, lat)</label>
                <textarea value={formData.polygonCoords.length > 0 ? JSON.stringify(formData.polygonCoords, null, 2) : ""} readOnly rows={Math.max(3, formData.polygonCoords.length)} className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg resize-none font-mono text-sm" />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 pt-4 border-t border-slate-200 mt-6">
              <button type="submit" className="flex-grow px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors">Enregistrer l'action</button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex-grow px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}


      {/* Recherche et Filtres (inchangés) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par commune, localité ou identification..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'en attente', label: 'En attente' },
              { key: 'en cours', label: 'En cours' },
              { key: 'résolu', label: 'Résolus' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau des descentes (inchangé) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement des descentes...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Commune</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Localité</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Identification</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Superficie (m²)</th>
                    
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Actions</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Infractions</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Opérations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedDescentes.length > 0 ? (
                    paginatedDescentes.map((descente, index) => (
                      <tr key={descente.identifica || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(descente.date_desce)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{descente.commune || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{descente.localite || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{descente.identifica || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {descente.superficie ? Number(descente.superficie).toFixed(2) : 'N/A'}
                        </td>
                        
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {descente.actions || 'Non spécifié'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(descente.infraction || '')}`}>
                            {descente.infraction || 'Non spécifié'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => handleViewClick(descente)}
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">Aucune descente trouvée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="p-4 flex justify-between items-center border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Affichage de {Math.min(startIndex + 1, filteredDescentes.length)} à {Math.min(startIndex + itemsPerPage, filteredDescentes.length)} sur {filteredDescentes.length} résultats
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || filteredDescentes.length === 0}
                  className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Modal pour afficher les détails (À implémenter) */}
      {showModal && selectedDescente && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center">
              <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="text-xl font-bold text-gray-900">Détails de la Descente</h3>
                      <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700">
                      <p><strong>Date:</strong> {formatDate(selectedDescente.date_desce)}</p>
                      <p><strong>Commune:</strong> {selectedDescente.commune}</p>
                      <p><strong>Localité:</strong> {selectedDescente.localite}</p>
                      <p><strong>Identification:</strong> {selectedDescente.identifica}</p>
                      <p><strong>Superficie:</strong> {selectedDescente.superficie.toFixed(2)} m²</p>
                      <p><strong>Infraction:</strong> <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedDescente.infraction)}`}>{selectedDescente.infraction}</span></p>
                      <p><strong>Actions Menées:</strong> {selectedDescente.actions}</p>
                      <p><strong>Suivi:</strong> {selectedDescente.actions_su}</p>
                      {/* Ajoutez d'autres détails ici */}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FieldActionsMap;
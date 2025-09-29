import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, FeatureGroup, LayersControl, useMapEvents } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import * as turf from "@turf/turf";
import { 
  Plus, Search, User, MapPin, Home, Tag, ArrowRight, DollarSign, 
  AlertTriangle, Globe, Edit, Eye, Clock, CheckCircle, AlertCircle, 
  X, ChevronLeft, ChevronRight, Calendar, Map, FileText, Navigation,
  Save, Trash2, FileDigit, ShieldAlert, Mail, Package, Receipt
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
  date_desce: Date;
  actions: string;
  n_pv_pat: string;
  n_fifafi: string;
  actions_su: string;
  proprietaire: string;
  commune: string;
  localite: string;
  identifica: string;
  x_coord: number;
  y_coord: number;
  x_long: number;
  y_lat: number;
  superficie: number;
  destination: string;
  montant: number;
  infraction: string;
  suite_a_do: string;
  amende_reg: number;
  n_pv_api: string;
  personne_r: string;
  pieces_fou: string;
  recommanda: string;
  Montant_1: number;
  Montant_2: number;
  reference: string;
  observation: string;
  situation: string;
  situatio_1: string;
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

// Fonction pour récupérer les statistiques d'infractions
const fetchInfractionStats = async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/infractions/categories");
    return response.data.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques d'infractions:", error);
    return [];
  }
};

const FieldActionsMap: React.FC = () => {
  const mapRef = useRef<L.Map>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  
  const [formData, setFormData] = useState(initialFormData);
  const [listeDescentes, setListeDescentes] = useState<Descente[]>([]);
  const [infractionStats, setInfractionStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchCoords, setSearchCoords] = useState({ x: "", y: "" });
  const [searchError, setSearchError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDescente, setSelectedDescente] = useState<Descente | null>(null);
  const [editingDescente, setEditingDescente] = useState<Descente | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Chargement des données de descente
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
          const parsedData = data.map(d => ({
            ...d,
            x_coord: Number(d.x_coord),
            y_coord: Number(d.y_coord),
            x_long: Number(d.x_long),
            y_lat: Number(d.y_lat),
            superficie: Number(d.superficie),
            montant: Number(d.montant),
            amende_reg: Number(d.amende_reg),
            Montant_1: Number(d.Montant_1),
            Montant_2: Number(d.Montant_2),
          }));
          setListeDescentes(parsedData);
          console.log(`✅ ${parsedData.length} descentes chargées avec succès`);
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

  // Chargement des statistiques d'infractions
  useEffect(() => {
    const loadInfractionStats = async () => {
      try {
        setLoadingStats(true);
        const stats = await fetchInfractionStats();
        setInfractionStats(stats);
      } catch (error) {
        console.error("Erreur de chargement des stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadInfractionStats();
  }, []);

  // Fonction pour obtenir l'icône et la couleur selon la catégorie
  const getCategoryStyle = (categorie: string) => {
    const categorieLower = categorie.toLowerCase();
    
    if (categorieLower.includes('remblai illicite') && !categorieLower.includes('construction')) {
      return {
        color: 'bg-red-500',
        icon: <AlertTriangle className="w-8 h-8 text-white" />,
        label: 'Remblai Illicite'
      };
    } else if (categorieLower.includes('construction sur remblai')) {
      return {
        color: 'bg-orange-500',
        icon: <Home className="w-8 h-8 text-white" />,
        label: 'Construction Remblai'
      };
    } else if (categorieLower.includes('domaines publics') || categorieLower.includes('digue') || categorieLower.includes('canal')) {
      return {
        color: 'bg-blue-500',
        icon: <MapPin className="w-8 h-8 text-white" />,
        label: 'Domaines Publics'
      };
    } else if (categorieLower.includes('autres infractions')) {
      return {
        color: 'bg-purple-500',
        icon: <FileText className="w-8 h-8 text-white" />,
        label: 'Autres Infractions'
      };
    } else {
      return {
        color: 'bg-gray-500',
        icon: <AlertCircle className="w-8 h-8 text-white" />,
        label: categorie
      };
    }
  };

  // Fonctions de gestion du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: inputValue } = e.target;
    const value = ['X_coord', 'Y_coord', 'montant'].includes(name) ? parseFloat(inputValue) || 0 : inputValue;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: inputValue } = e.target;
    const value = ['x_coord', 'y_coord', 'superficie', 'montant', 'amende_reg', 'Montant_1', 'Montant_2'].includes(name) 
      ? parseFloat(inputValue) || 0 
      : inputValue;
    setEditFormData({ ...editFormData, [name]: value });
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

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData(initialFormData);
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
  };

  // Gestion de la soumission du formulaire (CORRIGÉ)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("💾 Soumission du formulaire:", formData);
    alert("Formulaire soumis avec succès (voir console pour les données) !");
    resetForm(); 
    setShowForm(false); 
  };

  // Fonction pour ouvrir le modal d'édition
  const handleEditClick = (descente: Descente) => {
    setEditingDescente(descente);
    setEditFormData({
      date_desce: descente.date_desce || '',
      actions: descente.actions || '',
      n_pv_pat: descente.n_pv_pat || '',
      n_fifafi: descente.n_fifafi || '',
      actions_su: descente.actions_su || '',
      proprietaire: descente.proprietaire || '',
      commune: descente.commune || '',
      localite: descente.localite || '',
      identifica: descente.identifica || '',
      x_coord: descente.x_coord || 0,
      y_coord: descente.y_coord || 0,
      x_long: descente.x_long || 0,
      y_lat: descente.y_lat || 0,
      superficie: descente.superficie || 0,
      destination: descente.destination || '',
      montant: descente.montant || 0,
      infraction: descente.infraction || '',
      suite_a_do: descente.suite_a_do || '',
      amende_reg: descente.amende_reg || 0,
      n_pv_api: descente.n_pv_api || '',
      personne_r: descente.personne_r || '',
      pieces_fou: descente.pieces_fou || '',
      recommanda: descente.recommanda || '',
      Montant_1: descente.Montant_1 || 0,
      Montant_2: descente.Montant_2 || 0,
      reference: descente.reference || '',
      observation: descente.observation || '',
      situation: descente.situation || '',
      situatio_1: descente.situatio_1 || ''
    });
    setShowEditModal(true);
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editingDescente) return;

    try {
      console.log("💾 Sauvegarde des modifications:", editFormData);
      
      // Mise à jour locale (à remplacer par un appel API)
      const updatedDescentes = listeDescentes.map(d => 
        d.identifica === editingDescente.identifica ? { ...d, ...editFormData } : d
      );
      
      setListeDescentes(updatedDescentes);
      setShowEditModal(false);
      alert("Modifications sauvegardées avec succès !");
      
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde des modifications.");
    }
  };

  // Fonction pour supprimer une descente
  const handleDeleteDescente = async () => {
    if (!editingDescente) return;

    if (confirm("Êtes-vous sûr de vouloir supprimer cette descente ?")) {
      try {
        console.log("🗑️ Suppression de la descente:", editingDescente.identifica);
        
        const updatedDescentes = listeDescentes.filter(d => d.identifica !== editingDescente.identifica);
        
        setListeDescentes(updatedDescentes);
        setShowEditModal(false);
        alert("Descente supprimée avec succès !");
        
      } catch (error) {
        console.error("❌ Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de la descente.");
      }
    }
  };

  // Fonctions utilitaires
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';
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

  // Filtrage et pagination
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

  // Fonction pour centrer la carte sur les coordonnées de la descente
  const focusOnMap = (descente: Descente) => {
    if (mapRef.current && descente.x_coord && descente.y_coord) {
      mapRef.current.setView([descente.x_coord, descente.y_coord], 15);
    }
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

      {/* Statistiques par catégorie */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))
        ) : infractionStats.length > 0 ? (
          infractionStats.map((stat: any) => {
            const style = getCategoryStyle(stat.categorie_consolidee);
            return (
              <div key={stat.categorie_consolidee} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      {stat.categorie_consolidee}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.nombre_de_terrains}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">terrains concernés</p>
                  </div>
                  <div className={`p-3 rounded-full ${style.color}`}>
                    {style.icon}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-4 text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucune donnée d'infraction disponible</p>
          </div>
        )}
      </div>

      {/* Formulaire de nouvelle descente */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Nouvelle Action</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Le reste du code reste inchangé... */}
      {/* Recherche et Filtres */}
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
              { key: '', label: 'En attente' },
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

      {/* Tableau des descentes */}
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
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Localité</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Coord X</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Coord Y</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Actions</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Infractions</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Opérations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedDescentes.length > 0 ? (
                    paginatedDescentes.map((descente, index) => (
                      <tr key={descente.identifica || `index-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(descente.date_desce)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{descente.localite || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{descente.x_coord || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{descente.y_coord || 'N/A'}</td>
                        
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {descente.actions || 'Non spécifié'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(descente.infraction || '').color}`}>
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
                              onClick={() => handleEditClick(descente)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">Aucune descente trouvée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination simplifiée */}
            {filteredDescentes.length > 0 && (
              <div className="p-4 flex justify-between items-center border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Affichage de {Math.min(startIndex + 1, filteredDescentes.length)} à {Math.min(startIndex + itemsPerPage, filteredDescentes.length)} sur {filteredDescentes.length} résultats
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Précédent</span>
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || filteredDescentes.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de visualisation COMPLET */}
      {showModal && selectedDescente && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails complets de la descente</h3>
                <p className="text-gray-600 mt-1">Informations détaillées sur l'intervention terrain</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-6">
              {/* Section 1: Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Informations générales
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Date descente:</span>
                      <span className="text-gray-900">{formatDate(selectedDescente.date_desce)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Propriétaire:</span>
                      <span className="text-gray-900">{selectedDescente.proprietaire || 'Non spécifié'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Commune:</span>
                      <span className="text-gray-900">{selectedDescente.commune || 'Non spécifié'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Localité:</span>
                      <span className="text-gray-900">{selectedDescente.localite || 'Non spécifié'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Localisation et identification
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">ID Terrain:</span>
                      <span className="text-gray-900 font-mono">{selectedDescente.identifica || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Coord X/Lat:</span>
                      <span className="text-gray-900 font-mono">{selectedDescente.x_coord || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Coord Y/Lon:</span>
                      <span className="text-gray-900 font-mono">{selectedDescente.y_coord || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Superficie:</span>
                      <span className="text-gray-900 font-mono">
                        {selectedDescente.superficie ? `${Number(selectedDescente.superficie).toFixed(2)} m²` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileDigit className="w-5 h-5 text-purple-600" />
                    Références PV
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">N° PV PAT:</span>
                      <span className="text-gray-900">{selectedDescente.n_pv_pat || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">N° FIFAFI:</span>
                      <span className="text-gray-900">{selectedDescente.n_fifafi || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">N° PV API:</span>
                      <span className="text-gray-900">{selectedDescente.n_pv_api || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Référence:</span>
                      <span className="text-gray-900">{selectedDescente.reference || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Actions et infractions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Actions menées
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedDescente.actions || 'Aucune action spécifiée'}</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Suivi des actions:</h5>
                    <p className="text-blue-700">{selectedDescente.actions_su || 'Aucun suivi spécifié'}</p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-900 mb-2">Suite à donner:</h5>
                    <p className="text-yellow-700">{selectedDescente.suite_a_do || 'Non spécifié'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Infractions et sanctions
                  </h4>
                  
                  <div className={`p-4 rounded-lg ${getCategoryStyle(selectedDescente.infraction || '').color}`}>
                    <span className="font-medium">Type d'infraction:</span>
                    <p className="mt-1">{selectedDescente.infraction || 'Aucune infraction spécifiée'}</p>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4">
                    <h5 className="font-medium text-red-900 mb-2">Montants:</h5>
                    <div className="space-y-1">
                      <p>Amende: {selectedDescente.montant ? formatCurrency(selectedDescente.montant) : 'N/A'}</p>
                      <p>Amende régularisée: {selectedDescente.amende_reg ? formatCurrency(selectedDescente.amende_reg) : 'N/A'}</p>
                      <p>Montant 1: {selectedDescente.Montant_1 ? formatCurrency(selectedDescente.Montant_1) : 'N/A'}</p>
                      <p>Montant 2: {selectedDescente.Montant_2 ? formatCurrency(selectedDescente.Montant_2) : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Informations complémentaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    Personnes et documents
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Personne responsable:</span>
                      <span className="text-gray-900">{selectedDescente.personne_r || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Pièces fournies:</span>
                      <span className="text-gray-900">{selectedDescente.pieces_fou || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Recommandations:</span>
                      <span className="text-gray-900">{selectedDescente.recommanda || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Destination:</span>
                      <span className="text-gray-900">{selectedDescente.destination || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Observations et situations
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Situation:</span>
                      <span className="text-gray-900">{selectedDescente.situation || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Situation 1:</span>
                      <span className="text-gray-900">{selectedDescente.situatio_1 || 'N/A'}</span>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Observations:</h5>
                        <p className="text-gray-700">{selectedDescente.observation || 'Aucune observation'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Coordonnées détaillées */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Coordonnées détaillées
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">X Longitude:</span>
                    <p className="text-gray-900 font-mono">{selectedDescente.x_long || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Y Latitude:</span>
                    <p className="text-gray-900 font-mono">{selectedDescente.y_lat || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
                <button
                  onClick={() => {
                    if (selectedDescente.x_coord && selectedDescente.y_coord) {
                      focusOnMap(selectedDescente);
                      setShowModal(false);
                    }
                  }}
                  disabled={!selectedDescente.x_coord || !selectedDescente.y_coord}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Voir sur la carte</span>
                </button>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition (adapté pour toutes les nouvelles propriétés) */}
      {showEditModal && editingDescente && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Modifier la descente</h3>
                <p className="text-gray-600 mt-1">Modification des informations de l'intervention terrain</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Colonne 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de la descente</label>
                    <input
                      type="date"
                      name="date_desce"
                      value={editFormData.date_desce || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Propriétaire</label>
                    <input
                      type="text"
                      name="proprietaire"
                      value={editFormData.proprietaire || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commune</label>
                    <input
                      type="text"
                      name="commune"
                      value={editFormData.commune || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localité</label>
                    <input
                      type="text"
                      name="localite"
                      value={editFormData.localite || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Colonne 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Identification du terrain</label>
                    <input
                      type="text"
                      name="identifica"
                      value={editFormData.identifica || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coordonnée X (Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      name="x_coord"
                      value={editFormData.x_coord || 0}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coordonnée Y (Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      name="y_coord"
                      value={editFormData.y_coord || 0}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (m²)</label>
                    <input
                      type="number"
                      step="any"
                      name="superficie"
                      value={editFormData.superficie || 0}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Colonne 3 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Infractions constatées</label>
                    <input
                      type="text"
                      name="infraction"
                      value={editFormData.infraction || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant amende</label>
                    <input
                      type="number"
                      name="montant"
                      value={editFormData.montant || 0}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input
                      type="text"
                      name="destination"
                      value={editFormData.destination || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situation</label>
                    <input
                      type="text"
                      name="situation"
                      value={editFormData.situation || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Champs de texte multiligne */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actions menées</label>
                  <textarea
                    name="actions"
                    value={editFormData.actions || ''}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suivi des actions</label>
                  <textarea
                    name="actions_su"
                    value={editFormData.actions_su || ''}
                    onChange={handleEditInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                  <textarea
                    name="observation"
                    value={editFormData.observation || ''}
                    onChange={handleEditInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={handleDeleteDescente}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Sauvegarder</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldActionsMap;

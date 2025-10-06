import React, { useState, useEffect } from "react";
import axios from 'axios';
import { 
  Plus, Search, User, MapPin, Home, Tag,  
  AlertTriangle, Globe, Eye, Clock, CheckCircle, AlertCircle, 
  X, ChevronLeft, ChevronRight, Calendar, FileText
} from 'lucide-react';

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
  dateDescente: "",
  heureDescente: "",
  dateRendezVous: "",
  heureRendezVous: "",
  numeroPV: "",
  typeVerbalisateur: "",
  nomVerbalisateur: "",
  personneR: "",
  nomPersonneR: "",
  commune: "",
  fokontany: "",
  localite: "",
  X_coord: 0,
  Y_coord: 0,
  infraction: "",
  actions: [] as string[],
  modelePV: "PAT",
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

// Fonction pour enregistrer une nouvelle descente
const saveDescente = async (descenteData: any) => {
  try {
    console.log("📤 Envoi des données au serveur:", descenteData);
    
    const response = await axios.post("http://localhost:3000/api/nouvelle-descente/descentes", descenteData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log("✅ Réponse du serveur:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Erreur lors de l'enregistrement:", error);
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      throw new Error(error.response.data.message || "Erreur lors de l'enregistrement");
    } else if (error.request) {
      throw new Error("Impossible de contacter le serveur");
    } else {
      throw new Error("Erreur de configuration de la requête");
    }
  }
};

const FieldActionsComponent: React.FC = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [listeDescentes, setListeDescentes] = useState<Descente[]>([]);
  const [infractionStats, setInfractionStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDescente, setSelectedDescente] = useState<Descente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          // Tri par date décroissante pour afficher les nouvelles descentes en premier
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
          })).sort((a, b) => new Date(b.date_desce).getTime() - new Date(a.date_desce).getTime());
          
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value: inputValue } = e.target;
    const value = ['X_coord', 'Y_coord'].includes(name) ? parseFloat(inputValue) || 0 : inputValue;
    setFormData({ ...formData, [name]: value });
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

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData(initialFormData);
  };

  // Gestion de la soumission du formulaire AVEC ENREGISTREMENT API
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!formData.dateDescente || !formData.heureDescente || !formData.numeroPV || 
        !formData.typeVerbalisateur || !formData.nomVerbalisateur || !formData.commune || 
        !formData.fokontany || !formData.localite || !formData.infraction) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparation des données pour l'API - CORRECTION DU PROBLÈME actions
      const descenteData = {
        // Champs OBLIGATOIRES selon l'erreur
        dateDescente: new Date(formData.dateDescente).toISOString(),
        heureDescente: formData.heureDescente,
        numeroPV: formData.numeroPV,
        typeVerbalisateur: formData.typeVerbalisateur,
        nomVerbalisateur: formData.nomVerbalisateur,
        personneR: formData.personneR,
        nomPersonneR: formData.nomPersonneR,
        commune: formData.commune,
        fokontany: formData.fokontany,
        localite: formData.localite,
        infraction: formData.infraction,
        
        // Champs optionnels
        dateRendezVous: formData.dateRendezVous || "",
        heureRendezVous: formData.heureRendezVous || "",
        X_coord: formData.X_coord,
        Y_coord: formData.Y_coord,
        // CORRECTION : Envoyer le tableau directement ou selon ce qu'attend le serveur
        actions: formData.actions, // Envoyer le tableau directement
        modelePV: formData.modelePV,
        
        // Champs avec valeurs par défaut
        identifica: `DESC_${Date.now()}`,
        observation: `Rendez-vous: ${formData.dateRendezVous} ${formData.heureRendezVous}`,
      };

      console.log("💾 Données préparées pour l'API:", descenteData);

      // Appel à l'API pour enregistrer
      const result = await saveDescente(descenteData);
      
      console.log("✅ Descente enregistrée avec succès:", result);
      
      // Mettre à jour la liste locale avec les données formatées pour l'affichage
      const nouvelleDescentePourAffichage = {
        date_desce: new Date(formData.dateDescente),
        actions: formData.actions.join(", "), // Ici on garde le join pour l'affichage
        n_pv_pat: formData.modelePV === "PAT" ? formData.numeroPV : "",
        n_fifafi: formData.modelePV === "FIFAFI" ? formData.numeroPV : "",
        proprietaire: formData.nomPersonneR,
        commune: formData.commune,
        localite: formData.localite,
        identifica: `DESC_${Date.now()}`,
        x_coord: formData.X_coord,
        y_coord: formData.Y_coord,
        x_long: formData.Y_coord,
        y_lat: formData.X_coord,
        personne_r: formData.personneR,
        infraction: formData.infraction,
        // Champs par défaut pour l'affichage
        actions_su: "",
        superficie: 0,
        destination: "",
        montant: 0,
        suite_a_do: "",
        amende_reg: 0,
        n_pv_api: "",
        pieces_fou: "",
        recommanda: "",
        Montant_1: 0,
        Montant_2: 0,
        reference: "",
        observation: `Rendez-vous: ${formData.dateRendezVous} ${formData.heureRendezVous}`,
        situation: "",
        situatio_1: ""
      };
      
      // Ajouter la nouvelle descente au DÉBUT du tableau pour l'afficher en premier
      setListeDescentes(prev => [nouvelleDescentePourAffichage, ...prev]);
      
      // Afficher message de succès
      alert(result.message || "Descente enregistrée avec succès !");
      
      // Réinitialiser le formulaire
      resetForm();
      setShowForm(false);
      
    } catch (error: any) {
      console.error("❌ Erreur lors de l'enregistrement:", error);
      alert(`Erreur lors de l'enregistrement: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Non spécifié';
    return timeString;
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
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Nouvelle Descente sur Terrain</h2>
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

            {/* Informations de base - Date et heure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date de descente</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="date" 
                    name="dateDescente" 
                    value={formData.dateDescente} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Heure de descente</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="time" 
                    name="heureDescente" 
                    value={formData.heureDescente} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Numéro PV PAT/FIFAFI</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="numeroPV" 
                    placeholder="Numéro du PV" 
                    value={formData.numeroPV} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Verbalisateur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de verbalisateur</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select 
                    name="typeVerbalisateur" 
                    value={formData.typeVerbalisateur} 
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner le type</option>
                    <option value="PAT">PAT</option>
                    <option value="BS">BS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du verbalisateur</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="nomVerbalisateur" 
                    placeholder="Nom du verbalisateur" 
                    value={formData.nomVerbalisateur} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Informations Personne R et localisation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Personne R (PROPRIETAIRE OU REPRESENTANT)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select 
                    name="personneR" 
                    value={formData.personneR} 
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner le type</option>
                    <option value="PROPRIETAIRE">PROPRIETAIRE</option>
                    <option value="REPRESENTANT">REPRESENTANT</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom Personne R</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="nomPersonneR" 
                    placeholder="Nom de la personne R" 
                    value={formData.nomPersonneR} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commune</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="commune" 
                    placeholder="Commune" 
                    value={formData.commune} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fokontany</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="fokontany" 
                    placeholder="Fokontany" 
                    value={formData.fokontany} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localité</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="localite" 
                    placeholder="Localité" 
                    value={formData.localite} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coordonnée X (Latitude)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="number" 
                    step="any" 
                    name="X_coord" 
                    placeholder="Coordonnée X (Latitude)" 
                    value={formData.X_coord === 0 ? "" : formData.X_coord} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coordonnée Y (Longitude)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="number" 
                    step="any" 
                    name="Y_coord" 
                    placeholder="Coordonnée Y (Longitude)" 
                    value={formData.Y_coord === 0 ? "" : formData.Y_coord} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
            </div>

            {/* Infraction */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Infractions constatées</label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <textarea 
                  name="infraction" 
                  placeholder="Décrire les infractions constatées..." 
                  value={formData.infraction} 
                  onChange={handleInputChange} 
                  rows={4} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                  required 
                />
              </div>
            </div>
            {/* Date et heure du rendez-vous */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date du rendez-vous</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="date" 
                    name="dateRendezVous" 
                    value={formData.dateRendezVous} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Heure du rendez-vous</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="time" 
                    name="heureRendezVous" 
                    value={formData.heureRendezVous} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 pt-4 border-t border-slate-200 mt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex-grow px-6 py-2 bg-blue-500 text-white font-medium rounded-lg transition-colors ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enregistrement...</span>
                  </div>
                ) : (
                  'Enregistrer la descente'
                )}
              </button>
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
              <table className="w-full" style={{fontSize:"5px"}}>
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

      {/* Modal de visualisation - SEULEMENT LES CHAMPS DU FORMULAIRE */}
      {showModal && selectedDescente && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails de la descente</h3>
                <p className="text-gray-600 mt-1">Informations complètes de l'intervention</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-6">
              <div className="space-y-6">
                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de descente</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{formatDate(selectedDescente.date_desce)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro PV</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.n_pv_pat || selectedDescente.n_fifafi || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>

                {/* Verbalisateur */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de verbalisateur</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.n_pv_pat ? 'PAT' : selectedDescente.n_fifafi ? 'FIFAFI' : 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom du verbalisateur</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.personne_r || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>

                {/* Personne R */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type Personne R</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.personne_r ? 'PROPRIETAIRE/REPRESENTANT' : 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom Personne R</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.proprietaire || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>

                {/* Localisation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commune</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.commune || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fokontany</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.localite || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Localité</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.localite || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coordonnée X (Latitude)</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-mono">{selectedDescente.x_coord || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coordonnée Y (Longitude)</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-mono">{selectedDescente.y_coord || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actions menées</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{selectedDescente.actions || 'Aucune action spécifiée'}</p>
                  </div>
                </div>

                {/* Infractions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Infractions constatées</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{selectedDescente.infraction || 'Aucune infraction spécifiée'}</p>
                  </div>
                </div>

                {/* Rendez-vous */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date du rendez-vous</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.observation && selectedDescente.observation.includes('Rendez-vous:') 
                          ? selectedDescente.observation.split('Rendez-vous:')[1]?.split(' ')[1] || 'Non spécifié'
                          : 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure du rendez-vous</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.observation && selectedDescente.observation.includes('Rendez-vous:') 
                          ? selectedDescente.observation.split('Rendez-vous:')[1]?.split(' ')[2] || 'Non spécifié'
                          : 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldActionsComponent;
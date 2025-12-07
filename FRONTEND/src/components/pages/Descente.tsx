import React, { useState, useEffect } from "react";
import axios from 'axios';
import { 
  Plus, Search, User, MapPin, Home, Tag,  
  AlertTriangle, Globe, Eye, Clock, CheckCircle, AlertCircle, 
  X, ChevronLeft, ChevronRight, Calendar, FileText, Phone,
  Edit, Trash2
} from 'lucide-react';

// Composant Toast
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 ${getBackgroundColor()} text-white p-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-80 z-[9999] animate-in slide-in-from-right-full`}>
      {getIcon()}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Composant Info pour les toasts
const Info = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface Descente {
  n: number;
  date_desce: Date;
  actions: string;
  n_pv_pat: string;
  n_fifafi: string;
  actions_su: string;
  proprietai: string;
  commune: string;
  localisati: string;
  identifica: string;
  x_coord: number;
  y_coord: number;
  x_long: number;
  y_lat: number;
  superficie: number;
  destinatio: string;
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
  observatio: string;
  situation: string;
  situatio_1: string;
  heure_descente: string;
  date_rendez_vous: string;
  heure_rendez_vous: string;
  type_verbalisateur: string;
  nom_verbalisateur: string;
  nom_personne_r: string;
  fokontany: string;
  modele_pv: string;
  contact_r: string;
  adresse_r: string;
  dossier_a_fournir: string[];
}

interface FokontanyData {
  fokontany: string;
  commune: string;
  district: string;
}

const initialFormData = {
  dateDescente: "",
  heureDescente: "",
  dateRendezVous: "",
  heureRendezVous: "",
  numeroPV: "",
  reference: "",
  typeVerbalisateur: "",
  nomVerbalisateur: "",
  personneR: "",
  nomPersonneR: "",
  contactR: "",
  adresseR: "",
  commune: "",
  fokontany: "",
  district: "",
  localite: "",
  X_coord: 0,
  Y_coord: 0,
  check: [] as string[],
  actions: [] as string[],
  dossierAFournir: [] as string[],
  modelePV: "PAT",
};

// Configuration de base pour axios
const API_BASE_URL = "http://localhost:3000/api/nouvelle-descente";

// Fonctions API adaptées aux nouvelles routes
const saveDescente = async (descenteData: any) => {
  try {
    console.log("📤 Envoi des données au serveur:", descenteData);
    
    const response = await axios.post(`${API_BASE_URL}/descentes`, descenteData, {
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

const updateDescente = async (id: number, descenteData: any) => {
  try {
    console.log("📤 Mise à jour des données pour ID:", id, descenteData);
    
    const response = await axios.put(`${API_BASE_URL}/descentes/${id}`, descenteData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log("✅ Réponse du serveur:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      throw new Error(error.response.data.message || "Erreur lors de la mise à jour");
    } else if (error.request) {
      throw new Error("Impossible de contacter le serveur");
    } else {
      throw new Error("Erreur de configuration de la requête");
    }
  }
};

const deleteDescente = async (id: number) => {
  try {
    console.log("🗑️ Suppression de la descente ID:", id);
    
    const response = await axios.delete(`${API_BASE_URL}/descentes/${id}`);
    
    console.log("✅ Réponse du serveur:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression:", error);
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      throw new Error(error.response.data.message || "Erreur lors de la suppression");
    } else if (error.request) {
      throw new Error("Impossible de contacter le serveur");
    } else {
      throw new Error("Erreur de configuration de la requête");
    }
  }
};

const fetchDescentes = async () => {
  try {
    console.log("🔄 Chargement des descentes depuis:", `${API_BASE_URL}/descentes`);
    const response = await axios.get(`${API_BASE_URL}/descentes`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Erreur lors du chargement des descentes:", error);
    throw error;
  }
};

// Fonction pour rechercher les données de fokontany
const searchFokontany = async (searchTerm: string): Promise<FokontanyData[]> => {
  try {
    console.log("🔍 Recherche fokontany:", searchTerm);
    const response = await axios.get(`${API_BASE_URL}/recherche/fokontany?search=${encodeURIComponent(searchTerm)}`);
    return response.data.data || [];
  } catch (error: any) {
    console.error("❌ Erreur lors de la recherche fokontany:", error);
    return [];
  }
};

const FieldActionsComponent: React.FC = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [listeDescentes, setListeDescentes] = useState<Descente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDescente, setSelectedDescente] = useState<Descente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, descente: Descente | null}>({show: false, descente: null});
  const [fokontanySuggestions, setFokontanySuggestions] = useState<FokontanyData[]>([]);
  const [showFokontanySuggestions, setShowFokontanySuggestions] = useState(false);
  const [isSearchingFokontany, setIsSearchingFokontany] = useState(false);
  
  const itemsPerPage = 10;

  const dossierOptions = ['CSJ', 'Plan off', "PU (Permis d'Utilisation)", 'Permis de Construction', 'Permis de Remblais'];
  
  const checkOptions = [
    'remblai illicite',
    'construction sur remblai illicite',
    'cellage'
  ];

  // Fonction pour ajouter un toast
  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Fonction pour supprimer un toast
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fonction pour rechercher automatiquement le fokontany
  const handleFokontanySearch = async (fokontanyValue: string) => {
    if (fokontanyValue.length < 2) {
      setFokontanySuggestions([]);
      setShowFokontanySuggestions(false);
      return;
    }

    setIsSearchingFokontany(true);
    try {
      const results = await searchFokontany(fokontanyValue);
      setFokontanySuggestions(results);
      setShowFokontanySuggestions(results.length > 0);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setFokontanySuggestions([]);
      setShowFokontanySuggestions(false);
    } finally {
      setIsSearchingFokontany(false);
    }
  };

  // Fonction pour sélectionner un fokontany et remplir automatiquement commune et district
  const handleFokontanySelect = (fokontanyData: FokontanyData) => {
    setFormData(prev => ({
      ...prev,
      fokontany: fokontanyData.fokontany,
      commune: fokontanyData.commune,
      district: fokontanyData.district
    }));
    setShowFokontanySuggestions(false);
    setFokontanySuggestions([]);
  };

  // Fonction pour ouvrir le modal de confirmation
  const openConfirmationModal = () => {
    if (!formData.dateDescente || !formData.heureDescente || !formData.numeroPV || 
        !formData.typeVerbalisateur || !formData.nomVerbalisateur || !formData.commune || 
        !formData.fokontany || !formData.localite || formData.check.length === 0) {
      addToast("Veuillez remplir tous les champs obligatoires", 'warning');
      return;
    }
    setShowConfirmationModal(true);
  };

  // Fonction pour confirmer l'enregistrement
  const confirmSubmit = async () => {
    setShowConfirmationModal(false);
    await handleSubmit();
  };

  // Fonction pour ouvrir le formulaire de modification
  const handleEditClick = (descente: Descente) => {
    const infractionArray = parseInfractionToArray(descente.infraction);
    
    setFormData({
      dateDescente: descente.date_desce ? new Date(descente.date_desce).toISOString().split('T')[0] : "",
      heureDescente: descente.heure_descente || "",
      dateRendezVous: descente.date_rendez_vous ? new Date(descente.date_rendez_vous).toISOString().split('T')[0] : "",
      heureRendezVous: descente.heure_rendez_vous || "",
      numeroPV: descente.n_pv_pat || descente.n_fifafi || "",
      reference: descente.reference || "",
      typeVerbalisateur: descente.type_verbalisateur || "",
      nomVerbalisateur: descente.nom_verbalisateur || "",
      personneR: descente.personne_r || "",
      nomPersonneR: descente.nom_personne_r || descente.proprietai || "",
      contactR: descente.contact_r || "",
      adresseR: descente.adresse_r || "",
      commune: descente.commune || "",
      fokontany: descente.fokontany || "",
      district: "", // À récupérer si disponible dans les données
      localite: descente.localisati || "",
      X_coord: descente.x_coord || 0,
      Y_coord: descente.y_coord || 0,
      check: infractionArray,
      actions: descente.actions ? descente.actions.split(',').map(a => a.trim()) : [],
      dossierAFournir: Array.isArray(descente.dossier_a_fournir) ? descente.dossier_a_fournir : [],
      modelePV: descente.modele_pv || (descente.n_pv_pat ? "PAT" : "FIFAFI"),
    });
    
    setSelectedDescente(descente);
    setShowForm(true);
    setEditingMode(true);
  };

  // Fonction pour supprimer une descente
  const handleDeleteClick = (descente: Descente) => {
    setDeleteConfirmation({show: true, descente});
  };

  // Fonction pour confirmer la suppression
  const confirmDelete = async () => {
    if (!deleteConfirmation.descente) return;

    try {
      setIsLoading(true);
      await deleteDescente(deleteConfirmation.descente.n);
      
      setListeDescentes(prev => prev.filter(d => d.n !== deleteConfirmation.descente!.n));
      
      addToast("Descente supprimée avec succès", 'success');
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression:", error);
      addToast(`Erreur lors de la suppression: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      setDeleteConfirmation({show: false, descente: null});
    }
  };

  // Fonction pour mettre à jour une descente
  const handleUpdate = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!selectedDescente) return;
    
    setIsSubmitting(true);

    try {
      const infractionString = formData.check.join(', ');

      const descenteData = {
        dateDescente: formData.dateDescente,
        heureDescente: formData.heureDescente,
        numeroPV: formData.numeroPV,
        reference: formData.reference,
        typeVerbalisateur: formData.typeVerbalisateur,
        nomVerbalisateur: formData.nomVerbalisateur,
        personneR: formData.personneR,
        nomPersonneR: formData.nomPersonneR,
        contactR: formData.contactR,
        adresseR: formData.adresseR,
        commune: formData.commune,
        fokontany: formData.fokontany,
        localite: formData.localite,
        infraction: infractionString,
        dossierAFournir: formData.dossierAFournir,
        dateRendezVous: formData.dateRendezVous || "",
        heureRendezVous: formData.heureRendezVous || "",
        X_coord: formData.X_coord,
        Y_coord: formData.Y_coord,
        actions: formData.actions,
        modelePV: formData.modelePV,
      };

      console.log("💾 Mise à jour des données:", descenteData);

      const result = await updateDescente(selectedDescente.n, descenteData);
      
      console.log("✅ Descente mise à jour avec succès:", result);
      
      // Recharger les données depuis le serveur
      await loadDescentes();
      
      addToast("Descente mise à jour avec succès !", 'success');
      
      resetForm();
      setShowForm(false);
      
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour:", error);
      addToast(`Erreur lors de la mise à jour: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
      setEditingMode(false);
      setSelectedDescente(null);
    }
  };

  // Fonction pour charger les descentes
  const loadDescentes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("🔄 Chargement des données de descente...");
      const response = await fetchDescentes();
      
      console.log("✅ Réponse API reçue:", response);

      let data = response.data || response;

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
        const parsedData = data.map(d => {
          let dossierArray: string[] = [];
          if (Array.isArray(d.dossier_a_fournir)) {
            dossierArray = d.dossier_a_fournir;
          } else if (typeof d.dossier_a_fournir === 'string' && d.dossier_a_fournir.trim() !== '') {
            try {
              dossierArray = JSON.parse(d.dossier_a_fournir);
            } catch {
              dossierArray = [d.dossier_a_fournir];
            }
          }

          return {
            ...d,
            n: Number(d.n) || 0,
            x_coord: Number(d.x_coord) || 0,
            y_coord: Number(d.y_coord) || 0,
            x_long: Number(d.x_long) || 0,
            y_lat: Number(d.y_lat) || 0,
            superficie: Number(d.superficie) || 0,
            montant: Number(d.montant) || 0,
            amende_reg: Number(d.amende_reg) || 0,
            Montant_1: Number(d.Montant_1) || 0,
            Montant_2: Number(d.Montant_2) || 0,
            heure_descente: d.heure_descente || '',
            date_rendez_vous: d.date_rendez_vous || '',
            heure_rendez_vous: d.heure_rendez_vous || '',
            type_verbalisateur: d.type_verbalisateur || '',
            nom_verbalisateur: d.nom_verbalisateur || '',
            nom_personne_r: d.nom_personne_r || d.proprietai || '',
            fokontany: d.fokontany || '',
            modele_pv: d.modele_pv || '',
            contact_r: d.contact_r || '',
            adresse_r: d.adresse_r || '',
            dossier_a_fournir: dossierArray,
            commune: d.commune || '',
            localisati: d.localisati || '',
            infraction: d.infraction || '',
            reference: d.reference || '',
            personne_r: d.personne_r || '',
            actions: d.actions || ''
          };
        }).sort((a, b) => new Date(b.date_desce).getTime() - new Date(a.date_desce).getTime());
        
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
        errorMessage = "Endpoint non trouvé. Vérifiez la route /api/nouvelle-descente/descentes.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setListeDescentes([]);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDescentes();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value: inputValue } = e.target;
    const value = ['X_coord', 'Y_coord'].includes(name) ? parseFloat(inputValue) || 0 : inputValue;
    
    setFormData({ ...formData, [name]: value });

    // Si le champ modifié est fokontany, lancer la recherche automatique
    if (name === 'fokontany') {
      handleFokontanySearch(inputValue);
    }
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

  const handleDossierCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      dossierAFournir: checked 
        ? [...prev.dossierAFournir, value] 
        : prev.dossierAFournir.filter(dossier => dossier !== value)
    }));
  };

  const handleCheckCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      check: checked 
        ? [...prev.check, value] 
        : prev.check.filter(item => item !== value)
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, modelePV: e.target.value });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingMode(false);
    setSelectedDescente(null);
    setFokontanySuggestions([]);
    setShowFokontanySuggestions(false);
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);

    try {
      const infractionString = formData.check.join(', ');

      const descenteData = {
        dateDescente: formData.dateDescente,
        heureDescente: formData.heureDescente,
        numeroPV: formData.numeroPV,
        reference: formData.reference,
        typeVerbalisateur: formData.typeVerbalisateur,
        nomVerbalisateur: formData.nomVerbalisateur,
        personneR: formData.personneR,
        nomPersonneR: formData.nomPersonneR,
        contactR: formData.contactR,
        adresseR: formData.adresseR,
        commune: formData.commune,
        fokontany: formData.fokontany,
        localite: formData.localite,
        infraction: infractionString,
        dossierAFournir: formData.dossierAFournir,
        dateRendezVous: formData.dateRendezVous || "",
        heureRendezVous: formData.heureRendezVous || "",
        X_coord: formData.X_coord,
        Y_coord: formData.Y_coord,
        actions: formData.actions,
        modelePV: formData.modelePV,
      };

      console.log("💾 Données préparées pour l'API:", descenteData);

      const result = await saveDescente(descenteData);
      
      console.log("✅ Descente enregistrée avec succès:", result);
      
      // Recharger les données depuis le serveur
      await loadDescentes();
      
      addToast(result.message || "Descente enregistrée avec succès !", 'success');
      
      resetForm();
      setShowForm(false);
      
    } catch (error: any) {
      console.error("❌ Erreur lors de l'enregistrement:", error);
      addToast(`Erreur lors de l'enregistrement: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const parseInfractionToArray = (infractionString: string): string[] => {
    if (!infractionString) return [];
    return infractionString.split(',').map(item => item.trim()).filter(item => item !== '');
  };

  const filteredDescentes = listeDescentes.filter(descente => {
    const statusMatch = activeTab === 'all' || 
      (descente.actions && String(descente.actions).toLowerCase().includes(activeTab));

    const searchMatch = searchTerm === '' || 
      (descente.commune && String(descente.commune).toLowerCase().includes(searchTerm.toLowerCase())) || 
      (descente.localisati && String(descente.localisati).toLowerCase().includes(searchTerm.toLowerCase())) ||
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
      {/* Toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Modal de confirmation d'enregistrement */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[3000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer l'enregistrement</h3>
              </div>
              <button 
                onClick={() => setShowConfirmationModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">Êtes-vous sûr de vouloir enregistrer cette nouvelle descente ?</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-blue-800 mb-2">Résumé de la descente :</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><span className="font-medium">Date :</span> {formatDate(formData.dateDescente)}</p>
                  <p><span className="font-medium">Heure :</span> {formData.heureDescente}</p>
                  <p><span className="font-medium">Commune :</span> {formData.commune}</p>
                  <p><span className="font-medium">Fokontany :</span> {formData.fokontany}</p>
                  <p><span className="font-medium">District :</span> {formData.district}</p>
                  <p><span className="font-medium">Localité :</span> {formData.localite}</p>
                  <p><span className="font-medium">Infraction :</span> {formData.check.join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enregistrement...</span>
                  </div>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[3000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
              </div>
              <button 
                onClick={() => setDeleteConfirmation({show: false, descente: null})} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Êtes-vous sûr de vouloir supprimer cette descente ? Cette action est irréversible.
              </p>
              {deleteConfirmation.descente && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-red-800 mb-2">Descente à supprimer :</h4>
                  <div className="text-sm text-red-700 space-y-1">
                    <p><span className="font-medium">Date :</span> {formatDate(deleteConfirmation.descente.date_desce)}</p>
                    <p><span className="font-medium">Commune :</span> {deleteConfirmation.descente.commune}</p>
                    <p><span className="font-medium">Localité :</span> {deleteConfirmation.descente.localisati}</p>
                    <p><span className="font-medium">Infraction :</span> {deleteConfirmation.descente.infraction}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setDeleteConfirmation({show: false, descente: null})}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Suppression...</span>
                  </div>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Formulaire de nouvelle descente */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {editingMode ? 'Modifier la Descente' : 'Nouvelle Descente sur Terrain'}
          </h2>
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            if (editingMode) {
              handleUpdate(e);
            } else {
              openConfirmationModal(); 
            }
          }} className="space-y-6">
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Référence OM</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="reference" 
                    placeholder="Référence OM" 
                    value={formData.reference} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
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

            {/* Informations Personne R */}
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
            </div>

            {/* Contact et Adresse Personne R */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Personne R</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="contactR" 
                    placeholder="Contact de la personne R" 
                    value={formData.contactR} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse Personne R</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="adresseR" 
                    placeholder="Adresse de la personne R" 
                    value={formData.adresseR} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
            </div>

            {/* Localisation avec auto-complétion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="district" 
                    placeholder="District" 
                    value={formData.district} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    readOnly
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
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    readOnly
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fokontany *</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="fokontany" 
                    placeholder="Commencez à taper pour rechercher..." 
                    value={formData.fokontany} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                  {isSearchingFokontany && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                
                {/* Suggestions de fokontany */}
                {showFokontanySuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {fokontanySuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                        onClick={() => handleFokontanySelect(suggestion)}
                      >
                        <div className="font-medium text-slate-800">{suggestion.fokontany}</div>
                        <div className="text-sm text-slate-600">
                          {suggestion.commune} - {suggestion.district}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
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

            {/* Check - Cases à cocher multiples */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Infractions constatées</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {checkOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer border border-slate-300 rounded-lg p-3 hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      value={option} 
                      checked={formData.check.includes(option)} 
                      onChange={handleCheckCheckboxChange} 
                      className="form-checkbox text-blue-500 rounded" 
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dossier à fournir */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Dossier à fournir</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dossierOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer border border-slate-300 rounded-lg p-3 hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      value={option} 
                      checked={formData.dossierAFournir.includes(option)} 
                      onChange={handleDossierCheckboxChange} 
                      className="form-checkbox text-blue-500 rounded" 
                    />
                    <span>{option}</span>
                  </label>
                ))}
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
                className={`flex-grow px-6 py-2 ${
                  editingMode ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white font-medium rounded-lg transition-colors ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enregistrement...</span>
                  </div>
                ) : editingMode ? (
                  'Mettre à jour'
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
              onClick={loadDescentes}
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
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">ID</th>
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
                      <tr key={descente.n || `index-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {descente.n || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(descente.date_desce)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{descente.localisati || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{descente.x_coord || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{descente.y_coord || 'N/A'}</td>
                        
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {descente.actions || 'Non spécifié'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {descente.infraction ? (
                              parseInfractionToArray(descente.infraction).map((item, idx) => (
                                <span 
                                  key={idx}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(item).color}`}
                                >
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">Non spécifié</span>
                            )}
                          </div>
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
                              onClick={() => handleEditClick(descente)}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={() => handleDeleteClick(descente)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Modal de visualisation */}
      {showModal && selectedDescente && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails de la descente #{selectedDescente.n}</h3>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-mono">{selectedDescente.n}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de descente</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{formatDate(selectedDescente.date_desce)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure de descente</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.heure_descente || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro PV</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.n_pv_pat || selectedDescente.n_fifafi || 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Référence OM</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.reference?.trim() || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Modèle PV</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.modele_pv || 
                         (selectedDescente.n_pv_pat ? 'PAT' : 
                          selectedDescente.n_fifafi ? 'FIFAFI' : 'Non spécifié')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verbalisateur */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de verbalisateur</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.type_verbalisateur || 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom du verbalisateur</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.nom_verbalisateur || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>

                {/* Personne R */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type Personne R</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.personne_r || 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom Personne R</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.nom_personne_r || selectedDescente.proprietai || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact et Adresse */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Personne R</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.contact_r || 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse Personne R</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.adresse_r || 'Non spécifié'}
                      </p>
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
                      <p className="text-gray-900">{selectedDescente.fokontany || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Localité</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedDescente.localisati || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coordonnée X (Latitude)</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-mono">
                        {selectedDescente.x_coord || selectedDescente.x_long || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coordonnée Y (Longitude)</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-mono">
                        {selectedDescente.y_coord || selectedDescente.y_lat || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actions menées</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">
                      {selectedDescente.actions ? 
                        selectedDescente.actions.split(',').map(action => {
                          const actionMap: { [key: string]: string } = {
                            'depotPv': 'Dépôt PV',
                            'arretInteractif': 'Arrêt interactif des travaux',
                            'nonRespect': 'Non-respect de l\'arrêt interactif'
                          };
                          return actionMap[action.trim()] || action.trim();
                        }).join(', ') 
                        : 'Aucune action spécifiée'
                      }
                    </p>
                  </div>
                </div>

                {/* Dossier à fournir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dossier à fournir</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">
                      {selectedDescente.dossier_a_fournir && selectedDescente.dossier_a_fournir.length > 0 
                        ? selectedDescente.dossier_a_fournir.join(', ')
                        : selectedDescente.pieces_fou || 'Aucun dossier spécifié'}
                    </p>
                  </div>
                </div>

                {/* Infractions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Infractions constatées</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {selectedDescente.infraction ? (
                        parseInfractionToArray(selectedDescente.infraction).map((item, idx) => (
                          <span 
                            key={idx}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryStyle(item).color} text-white`}
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">Aucune infraction spécifiée</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rendez-vous */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date du rendez-vous</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.date_rendez_vous ? formatDate(selectedDescente.date_rendez_vous) : 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure du rendez-vous</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">
                        {selectedDescente.heure_rendez_vous || 'Non spécifié'}
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
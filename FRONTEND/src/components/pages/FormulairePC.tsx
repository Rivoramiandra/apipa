import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Home, Calendar, FileText, DollarSign, Building, Tag, 
  CheckCircle, AlertCircle, X, Plus, Search, Edit, Trash2, RefreshCw,
  Eye, ChevronLeft, ChevronRight, Globe, Navigation, Save, FileDigit,
  ShieldAlert, Mail, Package, Receipt, Clock, Map
} from 'lucide-react';

// Interface pour les données de l'API
interface DemandePC {
  id: number;
  demandeur: string;
  adresse: string;
  localisation: string;
  commune: string;
  proprietaire: string;
  titre: string;
  immatricul: string;
  x_coord: number;
  y_coord: number;
  x_long: number;
  y_lat: number;
  situation: string;
  prescription: string;
  reference: string;
  superficie: number;
  superfic_1: number;
  avis_de_pa: string;
  montant_de: number;
  service_en: string;
  date_d_arr: string;
  date_de_co: string;
  avis_commi: string;
  observatio: string;
  avis_defi: string;
  date_defi: string;
  categorie: string;
  annee: number;
  lng: number;
  lat: number;
}

// Interface pour les données du formulaire
interface FormData {
  demandeur: string;
  proprietaire: string;
  annee: number;
  commune: string;
  adresse: string;
  localisation: string;
  dateArriveeAPIPA: string;
  dateCommissionAPIPA: string;
  dateDefinitive: string;
  categorie: string;
  situationPC: string;
  surface: number;
  superficieDemande: number;
  immatriculationTerrain: string;
  reference: string;
  serviceEnvoyeur: string;
  avisDePaiement: string;
  montantRedevance: number;
  situationRedevance: string;
  avisCommissionDescente: string;
  observationCommission: string;
  zoneType: boolean | null;
  sousTypeZone: string;
}

const FormulairePC: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandePC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<DemandePC | null>(null);
  const [editingDemande, setEditingDemande] = useState<DemandePC | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<DemandePC>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const itemsPerPage = 10;

  // États pour le formulaire
  const [formData, setFormData] = useState<FormData>({
    demandeur: '',
    proprietaire: '',
    annee: new Date().getFullYear(),
    commune: '',
    adresse: '',
    localisation: '',
    dateArriveeAPIPA: '',
    dateCommissionAPIPA: '',
    dateDefinitive: '',
    categorie: 'regulier',
    situationPC: 'non traite',
    surface: 0,
    superficieDemande: 0,
    immatriculationTerrain: '',
    reference: '',
    serviceEnvoyeur: '',
    avisDePaiement: '',
    montantRedevance: 0,
    situationRedevance: '',
    avisCommissionDescente: '',
    observationCommission: '',
    zoneType: null,
    sousTypeZone: ''
  });

  const [zoneConstructible, setZoneConstructible] = useState<boolean | null>(null);

  // Zones disponibles
 const zonesConstructibles = [
  'cimitiere',
  'corridor commercial',
  'site de decharge et centre d\'enfoissement',
  'voirie existante',
  'zone commerciale',
  'zone commerciale primaire',
  'zone d\'equipement publique et administratif',
  'zone de developpement mixte',
  'zone industrielle',
  'zone militaire',
  'zone residentielle a faible densite',
  'zone residentielle a forte densite',
  'zone residentielle a tres faible densite',
  'zone residentielle a tres forte densite',
  'zone residentielle a moyenne densite'
];
const zonesNonConstructibles = [
  'espace vert et park',
  'pente rapide',
  'perimetre de protection',
  'plan d\'eau',
  'zone a PUDe',
  'zone boisee',
  'zone de developpement soumise a un plan d\'amenagement',
  'zone humide'
];

  // Style pour les inputs
  const inputStyle = "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

  // Charger les données depuis l'API
  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Tentative de connexion à l\'API...');
      const response = await fetch('http://localhost:3000/api/demandepc');
      
      console.log('Statut de la réponse:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse d\'erreur:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Données reçues:', data);
      
      setDemandes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur complète:', err);
      setError(`Impossible de charger les demandes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Gestion du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['annee', 'surface', 'superficieDemande', 'montantRedevance'].includes(name) 
        ? (value ? parseFloat(value) : 0)
        : value
    }));
  };

  const handleZoneTypeChange = (isConstructible: boolean) => {
    setZoneConstructible(isConstructible);
    setFormData(prev => ({
      ...prev,
      zoneType: isConstructible,
      sousTypeZone: '' // Réinitialiser le sous-type
    }));
  };

  const handleSousTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      sousTypeZone: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📋 Données du formulaire:', formData);
    // Ici vous intégrerez l'appel API pour créer une nouvelle demande
    alert('Demande créée avec succès !');
    setShowForm(false);
    // Réinitialiser le formulaire
    setFormData({
      demandeur: '',
      proprietaire: '',
      annee: new Date().getFullYear(),
      commune: '',
      adresse: '',
      localisation: '',
      dateArriveeAPIPA: '',
      dateCommissionAPIPA: '',
      dateDefinitive: '',
      categorie: 'regulier',
      situationPC: 'non traite',
      surface: 0,
      superficieDemande: 0,
      immatriculationTerrain: '',
      reference: '',
      serviceEnvoyeur: '',
      avisDePaiement: '',
      montantRedevance: 0,
      situationRedevance: '',
      avisCommissionDescente: '',
      observationCommission: '',
      zoneType: null,
      sousTypeZone: ''
    });
    setZoneConstructible(null);
  };

  // Fonction pour recharger les données
  const handleRetry = () => {
    fetchDemandes();
  };

  // Gestion de l'édition
  const handleEditClick = (demande: DemandePC) => {
    setEditingDemande(demande);
    setEditFormData({ ...demande });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: ['superficie', 'superfic_1', 'montant_de', 'annee', 'x_coord', 'y_coord', 'x_long', 'y_lat', 'lng', 'lat'].includes(name) 
        ? (value ? parseFloat(value) : 0)
        : value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingDemande) return;

    try {
      // Ici vous intégrerez l'appel API pour la mise à jour
      console.log('💾 Sauvegarde des modifications:', editFormData);
      
      // Mise à jour locale temporaire
      const updatedDemandes = demandes.map(d => 
        d.id === editingDemande.id ? { ...d, ...editFormData } : d
      );
      
      setDemandes(updatedDemandes);
      setShowEditModal(false);
      alert('Modifications sauvegardées avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des modifications.');
    }
  };

  const handleDeleteDemande = async () => {
    if (!editingDemande) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      try {
        console.log('🗑️ Suppression de la demande:', editingDemande.id);
        
        const updatedDemandes = demandes.filter(d => d.id !== editingDemande.id);
        setDemandes(updatedDemandes);
        setShowEditModal(false);
        alert('Demande supprimée avec succès !');
        
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la demande.');
      }
    }
  };

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non spécifié';
    try {
      const date = new Date(dateString);
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

  const getStatusColor = (situation: string) => {
    const situationLower = String(situation).toLowerCase();
    
    if (situationLower.includes('traite') || situationLower.includes('traité')) {
      return 'bg-green-100 text-green-700';
    } else if (situationLower.includes('en cours')) {
      return 'bg-blue-100 text-blue-700';
    } else if (situationLower.includes('en attente')) {
      return 'bg-yellow-100 text-yellow-700';
    } else if (situationLower.includes('rejeté') || situationLower.includes('rejete')) {
      return 'bg-red-100 text-red-700';
    } else {
      return 'bg-gray-100 text-gray-700';
    }
  };

  // Filtrage et pagination
  const filteredDemandes = demandes.filter(demande => {
    const statusMatch = activeTab === 'all' || 
      (demande.situation && String(demande.situation).toLowerCase().includes(activeTab));

    const searchMatch = searchTerm === '' || 
      (demande.demandeur && String(demande.demandeur).toLowerCase().includes(searchTerm.toLowerCase())) || 
      (demande.proprietaire && String(demande.proprietaire).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (demande.commune && String(demande.commune).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (demande.reference && String(demande.reference).toLowerCase().includes(searchTerm.toLowerCase()));

    return statusMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDemandes = filteredDemandes.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewClick = (demande: DemandePC) => {
    setSelectedDemande(demande);
    setShowModal(true);
  };

  // Compter les demandes par statut
  const totalDemandes = demandes.length;
  const demandesTraitees = demandes.filter(d => d.situation === 'traite').length;
  const demandesEnAttente = demandes.filter(d => d.situation === 'non traite' || !d.situation).length;
  const demandesRejetees = demandes.filter(d => d.situation && d.situation.toLowerCase().includes('rejet')).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permis de Construire</h1>
          <p className="text-gray-600 mt-1">Gestion des demandes de permis de construire</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rafraîchir</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Masquer le formulaire' : 'Nouvelle demande'}</span>
          </button>
        </div>
      </div>

      {/* FORMULAIRE DE NOUVELLE DEMANDE */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Nouvelle Demande de Permis de Construire</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations de base */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Demandeur</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="demandeur"
                    placeholder="Nom du demandeur"
                    value={formData.demandeur}
                    onChange={handleChange}
                    className={inputStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Propriétaire</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="proprietaire"
                    placeholder="Propriétaire"
                    value={formData.proprietaire}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Année</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    name="annee"
                    placeholder="Année"
                    value={formData.annee || ''}
                    onChange={handleChange}
                    className={inputStyle}
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
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="adresse"
                    placeholder="Adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localisation</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="localisation"
                    placeholder="Localisation"
                    value={formData.localisation}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Dates importantes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date d'arrivée APIPA</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    name="dateArriveeAPIPA"
                    value={formData.dateArriveeAPIPA}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date commission APIPA</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    name="dateCommissionAPIPA"
                    value={formData.dateCommissionAPIPA}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date définitive</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    name="dateDefinitive"
                    value={formData.dateDefinitive}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Catégorie et Situation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="regulier">Régulier</option>
                    <option value="irregulier">Irrégulier</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Situation PC</label>
                <div className="relative">
                  <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    name="situationPC"
                    value={formData.situationPC}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="non traite">Non traité</option>
                    <option value="traite">Traité</option>
                  </select>
                </div>
              </div>

              {/* Superficies */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Surface (m²)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    name="surface"
                    placeholder="Surface"
                    value={formData.surface || ''}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Superficie demandée (m²)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    name="superficieDemande"
                    placeholder="Superficie demandée"
                    value={formData.superficieDemande || ''}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Informations techniques */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Immatriculation terrain</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="immatriculationTerrain"
                    placeholder="Immatriculation terrain"
                    value={formData.immatriculationTerrain}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Référence</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="reference"
                    placeholder="Référence"
                    value={formData.reference}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service envoyeur</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="serviceEnvoyeur"
                    placeholder="Service envoyeur"
                    value={formData.serviceEnvoyeur}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Informations financières */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Avis de paiement</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="avisDePaiement"
                    placeholder="Avis de paiement"
                    value={formData.avisDePaiement}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Montant redevance (Ar)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    name="montantRedevance"
                    placeholder="Montant redevance"
                    value={formData.montantRedevance || ''}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Situation redevance</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="situationRedevance"
                    placeholder="Situation redevance"
                    value={formData.situationRedevance}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Prescription Urbanisme - Sur toute la largeur */}
            <div className="border-t border-slate-200 pt-6">
              <label className="block text-lg font-semibold text-slate-800 mb-4">Prescription Urbanisme</label>
              
              {/* Radio buttons pour le type de zone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Type de zone</label>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="zoneType"
                      checked={zoneConstructible === true}
                      onChange={() => handleZoneTypeChange(true)}
                      className="w-5 h-5 text-blue-500"
                    />
                    <span className="text-slate-700 font-medium">Zone constructible</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="zoneType"
                      checked={zoneConstructible === false}
                      onChange={() => handleZoneTypeChange(false)}
                      className="w-5 h-5 text-blue-500"
                    />
                    <span className="text-slate-700 font-medium">Zone non constructible</span>
                  </label>
                </div>
              </div>

              {/* Sélecteur pour le sous-type de zone */}
              {zoneConstructible !== null && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type de zone {zoneConstructible ? 'constructible' : 'non constructible'}
                  </label>
                  <div className="relative max-w-2xl">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      value={formData.sousTypeZone}
                      onChange={handleSousTypeChange}
                      className={inputStyle}
                      required
                    >
                      <option value="">Sélectionnez un type de zone...</option>
                      {(zoneConstructible ? zonesConstructibles : zonesNonConstructibles).map((zone, index) => (
                        <option key={index} value={zone}>
                          {zone.charAt(0).toUpperCase() + zone.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Textareas pour les observations */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Avis commission descente</label>
              <div className="relative max-w-2xl">
                <FileText className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <textarea
                  name="avisCommissionDescente"
                  placeholder="Avis commission descente"
                  value={formData.avisCommissionDescente}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observation commission</label>
              <div className="relative max-w-2xl">
                <FileText className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <textarea
                  name="observationCommission"
                  placeholder="Observation commission"
                  value={formData.observationCommission}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 pt-4 border-t border-slate-200 mt-6 max-w-2xl">
              <button 
                type="submit" 
                className="flex-grow px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                Enregistrer la demande
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-grow px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={handleRetry}
              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total demandes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalDemandes}</p>
              <p className="text-xs text-gray-500 mt-1">toutes catégories</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">En attente</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{demandesEnAttente}</p>
              <p className="text-xs text-gray-500 mt-1">en traitement</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-500">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Traités</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{demandesTraitees}</p>
              <p className="text-xs text-gray-500 mt-1">dossiers clos</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Rejetés</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{demandesRejetees}</p>
              <p className="text-xs text-gray-500 mt-1">non conformes</p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recherche et Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par demandeur, propriétaire, commune..."
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
              { key: 'traite', label: 'Traités' },
              { key: 'rejet', label: 'Rejetés' }
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

      {/* Tableau des demandes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={handleRetry}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Demandeur</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Adresse</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Situation</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Coord X</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Coord Y</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Titre</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Opérations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedDemandes.length > 0 ? (
                    paginatedDemandes.map((demande) => (
                      <tr key={demande.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {demande.demandeur || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>
                            <div>{demande.adresse || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(demande.situation)}`}>
                            {demande.situation || 'Non spécifié'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {demande.x_coord || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {demande.y_coord || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {demande.titre || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => handleViewClick(demande)}
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Modifier"
                              onClick={() => handleEditClick(demande)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        Aucune demande trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filteredDemandes.length > 0 && (
              <div className="p-4 flex justify-between items-center border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Affichage de {Math.min(startIndex + 1, filteredDemandes.length)} à {Math.min(startIndex + itemsPerPage, filteredDemandes.length)} sur {filteredDemandes.length} résultats
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
                    disabled={currentPage === totalPages || filteredDemandes.length === 0}
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
      {showModal && selectedDemande && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails complets de la demande</h3>
                <p className="text-gray-600 mt-1">Informations détaillées sur la demande de permis de construire</p>
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
                    <User className="w-5 h-5 text-blue-600" />
                    Informations générales
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Demandeur:</span>
                      <span className="text-gray-900">{selectedDemande.demandeur || 'Non spécifié'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Propriétaire:</span>
                      <span className="text-gray-900">{selectedDemande.proprietaire || 'Non spécifié'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Commune:</span>
                      <span className="text-gray-900">{selectedDemande.commune || 'Non spécifié'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Localisation:</span>
                      <span className="text-gray-900">{selectedDemande.localisation || 'Non spécifié'}</span>
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
                      <span className="font-medium text-gray-700">Titre:</span>
                      <span className="text-gray-900">{selectedDemande.titre || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Immatriculation:</span>
                      <span className="text-gray-900 font-mono">{selectedDemande.immatricul || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Coord X/Lat:</span>
                      <span className="text-gray-900 font-mono">{selectedDemande.x_coord || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Coord Y/Lon:</span>
                      <span className="text-gray-900 font-mono">{selectedDemande.y_coord || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Dates importantes
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Date d'arrivée:</span>
                      <span className="text-gray-900">{formatDate(selectedDemande.date_d_arr)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Date commission:</span>
                      <span className="text-gray-900">{formatDate(selectedDemande.date_de_co)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Date définitive:</span>
                      <span className="text-gray-900">{formatDate(selectedDemande.date_defi)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Année:</span>
                      <span className="text-gray-900">{selectedDemande.annee || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Caractéristiques techniques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-orange-600" />
                    Caractéristiques du terrain
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Superficie:</span>
                      <span className="text-gray-900">{selectedDemande.superficie ? `${selectedDemande.superficie} m²` : 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Superficie 1:</span>
                      <span className="text-gray-900">{selectedDemande.superfic_1 ? `${selectedDemande.superfic_1} m²` : 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Prescription:</span>
                      <span className="text-gray-900">{selectedDemande.prescription || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Catégorie:</span>
                      <span className="text-gray-900">{selectedDemande.categorie || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Aspects financiers
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Montant:</span>
                      <span className="text-gray-900">{selectedDemande.montant_de ? formatCurrency(selectedDemande.montant_de) : 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Avis de paiement:</span>
                      <span className="text-gray-900">{selectedDemande.avis_de_pa || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Service envoyeur:</span>
                      <span className="text-gray-900">{selectedDemande.service_en || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Référence:</span>
                      <span className="text-gray-900">{selectedDemande.reference || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Avis et observations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Avis et décisions
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Avis commission:</h5>
                      <p className="text-gray-700">{selectedDemande.avis_commi || 'Aucun avis'}</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">Avis définitif:</h5>
                      <p className="text-blue-700">{selectedDemande.avis_defi || 'Aucun avis'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Situation et observations
                  </h4>
                  
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg ${getStatusColor(selectedDemande.situation)}`}>
                      <span className="font-medium">Situation:</span>
                      <p className="mt-1">{selectedDemande.situation || 'Non spécifiée'}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Observations:</h5>
                      <p className="text-gray-700">{selectedDemande.observatio || 'Aucune observation'}</p>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">X Longitude:</span>
                    <p className="text-gray-900 font-mono">{selectedDemande.x_long || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Y Latitude:</span>
                    <p className="text-gray-900 font-mono">{selectedDemande.y_lat || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Longitude:</span>
                    <p className="text-gray-900 font-mono">{selectedDemande.lng || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Latitude:</span>
                    <p className="text-gray-900 font-mono">{selectedDemande.lat || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
                <button
                  onClick={() => handleEditClick(selectedDemande)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
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

      {/* Modal d'édition */}
      {showEditModal && editingDemande && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Modifier la demande</h3>
                <p className="text-gray-600 mt-1">Modification des informations de la demande de permis</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colonne 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Demandeur</label>
                    <input
                      type="text"
                      name="demandeur"
                      value={editFormData.demandeur || ''}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      name="adresse"
                      value={editFormData.adresse || ''}
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
                </div>

                {/* Colonne 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situation</label>
                    <select
                      name="situation"
                      value={editFormData.situation || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="en attente">En attente</option>
                      <option value="traite">Traité</option>
                      <option value="rejeté">Rejeté</option>
                      <option value="en cours">En cours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coordonnée X</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coordonnée Y</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      name="titre"
                      value={editFormData.titre || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Champs de texte multiligne */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                  <textarea
                    name="observatio"
                    value={editFormData.observatio || ''}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avis commission</label>
                  <textarea
                    name="avis_commi"
                    value={editFormData.avis_commi || ''}
                    onChange={handleEditInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={handleDeleteDemande}
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

export default FormulairePC;
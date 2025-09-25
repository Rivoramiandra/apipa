import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit, Trash2, Truck, Save, X, Calendar, User, FileText, 
  CheckCircle, XCircle, Clock, CreditCard, MapPin, Phone, Car, Route, 
  Settings, Hash, Package, Map, Euro, Edit3, AlertCircle, Loader, ChevronDown
} from 'lucide-react';

interface TruckAuthorization {
  id: number;
  numeroAutorisation: string;
  nomProprietaire: string;
  telephoneProprietaire: string;
  adresseProprietaire: string;
  marqueVehicule: string;
  modeleVehicule: string;
  numeroImmatriculation: string;
  typeTransport: string;
  itineraire: string;
  dateDebut: string;
  dateFin: string;
  montantTaxe: number;
  statusPaiement: 'paid' | 'pending' | 'overdue';
  statusAutorisation: 'approved' | 'pending' | 'rejected' | 'expired';
  dateCreation: string;
  observations: string;
}

export default function TruckAuthorization() {
  const [authorizations, setAuthorizations] = useState<TruckAuthorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'expired'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    numeroAutorisation: '',
    nomProprietaire: '',
    telephoneProprietaire: '',
    adresseProprietaire: '',
    marqueVehicule: '',
    modeleVehicule: '',
    numeroImmatriculation: '',
    typeTransport: '',
    itineraire: '',
    dateDebut: '',
    dateFin: '',
    montantTaxe: 0,
    observations: ''
  });

  // Charger les données depuis l'API
  useEffect(() => {
    fetchAuthorizations();
  }, []);

  const fetchAuthorizations = async () => {
  try {
    setLoading(true);
    const response = await axios.get('http://localhost:3000/api/autorisationcamion');

    console.log('Données récupérées du backend:', response.data);

   const mappedData: TruckAuthorization[] = response.data.map((item: any) => ({
  id: item.id,
  numeroAutorisation: item.Rfrence?.toString() || `AUT-???`,
  nomProprietaire: item.Propritaireducamion || '',
  telephoneProprietaire: item.TelephoneProprietaire || '',
  adresseProprietaire: item.AdresseProprietaire || '',
  marqueVehicule: item.MarqueVehicule || '',
  modeleVehicule: item.ModeleVehicule || '',
  numeroImmatriculation: item.Immatriculationducamion || '',
  typeTransport: item.TypeTransport || '',
  itineraire: item.Itineraire || '',
  dateDebut: item.DateDebut || new Date().toISOString(),
  dateFin: item.DateFin || new Date().toISOString(),
  montantTaxe: item.MontantTaxe || 0,
  statusPaiement: item.StatusPaiement || 'pending',
  statusAutorisation: item.StatusAutorisation || 'pending',
  dateCreation: item.DateCreation || new Date().toISOString(),
  observations: item.Observations || ''
}));


    setAuthorizations(mappedData);
    setError(null);
  } catch (err) {
    console.error('Erreur lors du chargement des autorisations:', err);
    setError('Impossible de charger les données. Veuillez réessayer.');
  } finally {
    setLoading(false);
  }
};

  const generateAuthorizationNumber = () => {
    const year = new Date().getFullYear();
    const count = authorizations.length + 1;
    return `AUT-${year}-${count.toString().padStart(3, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const authorizationData = {
      ...formData,
      id: editingId || Date.now(),
      numeroAutorisation: editingId ? formData.numeroAutorisation : generateAuthorizationNumber(),
      montantTaxe: parseFloat(formData.montantTaxe.toString()),
      statusPaiement: 'pending',
      statusAutorisation: 'pending',
      dateCreation: new Date().toISOString().split('T')[0]
    };

    try {
      if (editingId) {
        // Mettre à jour une autorisation existante
        await axios.put(`http://localhost:3000/api/autorisationcamion/${editingId}`, authorizationData);
        setAuthorizations(prev => prev.map(auth => 
          auth.id === editingId ? { ...authorizationData, id: editingId } as TruckAuthorization : auth
        ));
        setEditingId(null);
      } else {
        // Créer une nouvelle autorisation - Correction: même port que les autres requêtes
        const response = await axios.post('http://localhost:3000/api/autorisationcamion', authorizationData);
        setAuthorizations(prev => [...prev, response.data]);
      }

      // Reset form
      setFormData({
        numeroAutorisation: '',
        nomProprietaire: '',
        telephoneProprietaire: '',
        adresseProprietaire: '',
        marqueVehicule: '',
        modeleVehicule: '',
        numeroImmatriculation: '',
        typeTransport: '',
        itineraire: '',
        dateDebut: '',
        dateFin: '',
        montantTaxe: 0,
        observations: ''
      });
      setShowForm(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Une erreur est survenue lors de la sauvegarde.');
    }
  };

  const handleEdit = (authorization: TruckAuthorization) => {
    setFormData({
      numeroAutorisation: authorization.numeroAutorisation,
      nomProprietaire: authorization.nomProprietaire,
      telephoneProprietaire: authorization.telephoneProprietaire,
      adresseProprietaire: authorization.adresseProprietaire,
      marqueVehicule: authorization.marqueVehicule,
      modeleVehicule: authorization.modeleVehicule,
      numeroImmatriculation: authorization.numeroImmatriculation,
      typeTransport: authorization.typeTransport,
      itineraire: authorization.itineraire,
      dateDebut: authorization.dateDebut,
      dateFin: authorization.dateFin,
      montantTaxe: authorization.montantTaxe,
      observations: authorization.observations
    });
    setEditingId(authorization.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette autorisation ?')) {
      try {
        await axios.delete(`http://localhost:3000/api/autorisationcamion/${id}`);
        setAuthorizations(prev => prev.filter(auth => auth.id !== id));
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert('Une erreur est survenue lors de la suppression.');
      }
    }
  };

  const updateStatus = async (id: number, status: 'approved' | 'pending' | 'rejected' | 'expired') => {
    try {
      setUpdatingStatus(id);
      await axios.patch(`http://localhost:3000/api/autorisationcamion/${id}`, {
        statusAutorisation: status
      });
      setAuthorizations(prev => prev.map(auth => 
        auth.id === id ? { ...auth, statusAutorisation: status } : auth
      ));
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      alert('Une erreur est survenue lors de la mise à jour du statut.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updatePaymentStatus = async (id: number, status: 'paid' | 'pending' | 'overdue') => {
    try {
      setUpdatingStatus(id);
      await axios.patch(`http://localhost:3000/api/autorisationcamion/${id}`, {
        statusPaiement: status
      });
      setAuthorizations(prev => prev.map(auth => 
        auth.id === id ? { ...auth, statusPaiement: status } : auth
      ));
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut de paiement:', err);
      alert('Une erreur est survenue lors de la mise à jour du statut de paiement.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredAuthorizations = authorizations.filter(auth => {
    const matchesSearch = 
      (auth.nomProprietaire?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (auth.numeroAutorisation?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (auth.numeroImmatriculation?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (auth.typeTransport?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesStatus = statusFilter === 'all' || auth.statusAutorisation === statusFilter;
    const matchesPayment = paymentFilter === 'all' || auth.statusPaiement === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusColor = (status: string, type: 'payment' | 'authorization') => {
    if (type === 'payment') {
      switch (status) {
        case 'paid': return 'bg-green-100 text-green-800 border border-green-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'overdue': return 'bg-red-100 text-red-800 border border-red-200';
        default: return 'bg-gray-100 text-gray-800 border border-gray-200';
      }
    } else {
      switch (status) {
        case 'approved': return 'bg-green-100 text-green-800 border border-green-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
        case 'expired': return 'bg-gray-100 text-gray-800 border border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border border-gray-200';
      }
    }
  };

  const getStatusText = (status: string, type: 'payment' | 'authorization') => {
    if (type === 'payment') {
      switch (status) {
        case 'paid': return 'Payé';
        case 'pending': return 'En attente';
        case 'overdue': return 'En retard';
        default: return 'Inconnu';
      }
    } else {
      switch (status) {
        case 'approved': return 'Approuvé';
        case 'pending': return 'En attente';
        case 'rejected': return 'Rejeté';
        case 'expired': return 'Expiré';
        default: return 'Inconnu';
      }
    }
  };

  const getStatusIcon = (status: string, type: 'payment' | 'authorization') => {
    if (type === 'payment') {
      switch (status) {
        case 'paid': return <CheckCircle className="w-3 h-3" />;
        case 'pending': return <Clock className="w-3 h-3" />;
        case 'overdue': return <AlertCircle className="w-3 h-3" />;
        default: return <Clock className="w-3 h-3" />;
      }
    } else {
      switch (status) {
        case 'approved': return <CheckCircle className="w-3 h-3" />;
        case 'pending': return <Clock className="w-3 h-3" />;
        case 'rejected': return <XCircle className="w-3 h-3" />;
        case 'expired': return <AlertCircle className="w-3 h-3" />;
        default: return <Clock className="w-3 h-3" />;
      }
    }
  };

  const stats = {
    total: authorizations.length,
    approved: authorizations.filter(a => a.statusAutorisation === 'approved').length,
    pending: authorizations.filter(a => a.statusAutorisation === 'pending').length,
    paid: authorizations.filter(a => a.statusPaiement === 'paid').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-slate-600">Chargement des autorisations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">Erreur de chargement</h3>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={fetchAuthorizations}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Autorisations Camion</h1>
          <p className="text-slate-600 mt-1">Gestion des autorisations de transport par camion</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Autorisation</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Total autorisations</p>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <Truck className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Approuvées</p>
              <p className="text-xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">En attente</p>
              <p className="text-xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Payées</p>
              <p className="text-xl font-bold text-purple-600">{stats.paid}</p>
            </div>
            <CreditCard className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une autorisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous statuts</option>
              <option value="approved">Approuvé</option>
              <option value="pending">En attente</option>
              <option value="rejected">Rejeté</option>
              <option value="expired">Expiré</option>
            </select>
            
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous paiements</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {editingId ? 'Modifier Autorisation' : 'Nouvelle Autorisation Camion'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form 
              onSubmit={handleSubmit} 
              className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto"
            >
              {/* === COLONNE GAUCHE === */}
              <div className="flex flex-col gap-4">
                {/* Section Propriétaire */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Informations du propriétaire
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={14} className="text-blue-500" />
                      Nom complet
                    </label>
                    <input
                      type="text"
                      name="nomProprietaire"
                      value={formData.nomProprietaire}
                      onChange={handleInputChange}
                      placeholder="Ex: Jean Dupont"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-blue-500" />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="telephoneProprietaire"
                      value={formData.telephoneProprietaire}
                      onChange={handleInputChange}
                      placeholder="Ex: 06 12 34 56 78"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="text-blue-500" />
                      Adresse
                    </label>
                    <input
                      type="text"
                      name="adresseProprietaire"
                      value={formData.adresseProprietaire}
                      onChange={handleInputChange}
                      placeholder="Ex: 123 Avenue des Champs-Élysées, Paris"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>
                </div>

                {/* Section Véhicule */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-500" />
                    Informations du véhicule
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <Car size={14} className="text-blue-500" />
                      Marque
                    </label>
                    <input
                      type="text"
                      name="marqueVehicule"
                      value={formData.marqueVehicule}
                      onChange={handleInputChange}
                      placeholder="Ex: Renault"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <Settings size={14} className="text-blue-500" />
                      Modèle
                    </label>
                    <input
                      type="text"
                      name="modeleVehicule"
                      value={formData.modeleVehicule}
                      onChange={handleInputChange}
                      placeholder="Ex: Master"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <Hash size={14} className="text-blue-500" />
                      Immatriculation
                    </label>
                    <input
                      type="text"
                      name="numeroImmatriculation"
                      value={formData.numeroImmatriculation}
                      onChange={handleInputChange}
                      placeholder="Ex: AB-123-CD"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 uppercase"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* === COLONNE DROITE === */}
              <div className="flex flex-col gap-4">
                {/* Section Transport */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Route className="w-4 h-4 text-blue-500" />
                    Informations de transport
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <Package size={14} className="text-blue-500" />
                      Type de transport
                    </label>
                    <select
                      name="typeTransport"
                      value={formData.typeTransport}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                      required
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="Matériaux de construction">Matériaux de construction</option>
                      <option value="Déblais et remblais">Déblais et remblais</option>
                      <option value="Terre et déblais">Terre et déblais</option>
                      <option value="Sable et gravier">Sable et gravier</option>
                      <option value="Autres matériaux">Autres matériaux</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <Map size={14} className="text-blue-500" />
                      Itinéraire
                    </label>
                    <input
                      type="text"
                      name="itineraire"
                      value={formData.itineraire}
                      onChange={handleInputChange}
                      placeholder="Ex: Paris → Lyon"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-blue-500" />
                        Date de début
                      </label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={formData.dateDebut}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-blue-500" />
                        Date de fin
                      </label>
                      <input
                        type="date"
                        name="dateFin"
                        value={formData.dateFin}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <Euro size={14} className="text-blue-500" />
                      Montant de la taxe
                    </label>
                    <input
                      type="number"
                      name="montantTaxe"
                      value={formData.montantTaxe}
                      onChange={handleInputChange}
                      placeholder="Ex: 150.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>
                </div>

                {/* Section Observations */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Observations
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <Edit3 size={14} className="text-blue-500" />
                      Notes supplémentaires
                    </label>
                    <textarea
                      name="observations"
                      value={formData.observations}
                      onChange={handleInputChange}
                      placeholder="Ajoutez des informations complémentaires..."
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* === FOOTER === */}
              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 shadow-md transition-all"
                >
                  {editingId ? <Save size={16} /> : <Plus size={16} />}
                  {editingId ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Autorisation</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Propriétaire</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Véhicule</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Période</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Montant</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Paiement</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Statut</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAuthorizations.map((authorization) => (
                <tr key={authorization.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{authorization.numeroAutorisation}</div>
                      <div className="text-sm text-slate-600">{authorization.typeTransport}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{authorization.nomProprietaire}</div>
                      <div className="text-sm text-slate-600">{authorization.telephoneProprietaire}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm text-slate-800">{authorization.marqueVehicule} {authorization.modeleVehicule}</div>
                      <div className="text-sm text-slate-600">{authorization.numeroImmatriculation}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm text-slate-800">{new Date(authorization.dateDebut).toLocaleDateString()}</div>
                      <div className="text-sm text-slate-600">au {new Date(authorization.dateFin).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {authorization.montantTaxe.toLocaleString()} Ar
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative group">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(authorization.statusPaiement, 'payment')}`}>
                        {getStatusIcon(authorization.statusPaiement, 'payment')}
                        <span className="ml-1">{getStatusText(authorization.statusPaiement, 'payment')}</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </span>
                      <div className="absolute left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button
                          onClick={() => updatePaymentStatus(authorization.id, 'paid')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
                          disabled={updatingStatus === authorization.id}
                        >
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Marquer comme Payé
                        </button>
                        <button
                          onClick={() => updatePaymentStatus(authorization.id, 'pending')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
                          disabled={updatingStatus === authorization.id}
                        >
                          <Clock className="w-3 h-3 text-yellow-500" />
                          Marquer En attente
                        </button>
                        <button
                          onClick={() => updatePaymentStatus(authorization.id, 'overdue')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
                          disabled={updatingStatus === authorization.id}
                        >
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          Marquer En retard
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative group">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(authorization.statusAutorisation, 'authorization')}`}>
                        {getStatusIcon(authorization.statusAutorisation, 'authorization')}
                        <span className="ml-1">{getStatusText(authorization.statusAutorisation, 'authorization')}</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </span>
                      <div className="absolute left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button
                          onClick={() => updateStatus(authorization.id, 'approved')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
                          disabled={updatingStatus === authorization.id}
                        >
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Approuver
                        </button>
                        <button
                          onClick={() => updateStatus(authorization.id, 'pending')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
                          disabled={updatingStatus === authorization.id}
                        >
                          <Clock className="w-3 h-3 text-yellow-500" />
                          Marquer En attente
                        </button>
                        <button
                          onClick={() => updateStatus(authorization.id, 'rejected')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
                          disabled={updatingStatus === authorization.id}
                        >
                          <XCircle className="w-3 h-3 text-red-500" />
                          Rejeter
                        </button>
                        <button
                          onClick={() => updateStatus(authorization.id, 'expired')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
                          disabled={updatingStatus === authorization.id}
                        >
                          <AlertCircle className="w-3 h-3 text-gray-500" />
                          Marquer Expiré
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(authorization)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(authorization.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAuthorizations.length === 0 && (
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune autorisation trouvée</h3>
            <p className="text-slate-500">
              {searchTerm ? 'Aucun résultat pour votre recherche.' : 'Commencez par créer une nouvelle autorisation.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
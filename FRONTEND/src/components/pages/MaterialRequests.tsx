import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, 
  ChevronLeft, ChevronRight, Eye, Edit, X, User, MapPin, Calendar,
  AlertTriangle, DollarSign, Save, Trash2
} from 'lucide-react';
import axios from 'axios';

interface Remblai {
  id: number;
  proprietaire: string;
  commune: string;
  localite: string;
  volume: number;
  montant: number;
  situation: string;
  date_demande: string;
  date_echeance: string;
}

interface TransformedRequest {
  id: string;
  title: string;
  site: string;
  quantity: string;
  priority: string;
  status: string;
  requestDate: string;
  requiredDate: string;
  requestedBy: string;
  originalData: Remblai;
}

const MaterialRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState<Remblai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransformedRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<Remblai | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Remblai>>({});
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔄 Chargement des données de remblai...");
        const response = await axios.get('http://localhost:3000/api/remblai');
        
        console.log("✅ Réponse API reçue:", response.data);

        let data = response.data;
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
          setRequests(data);
          console.log(`✅ ${data.length} demandes de remblai chargées avec succès`);
        } else {
          throw new Error("Format de données invalide");
        }

      } catch (err: any) {
        console.error("❌ Erreur de chargement:", err);
        let errorMessage = "Erreur lors du chargement des données";

        if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
          errorMessage = "Impossible de se connecter au serveur. Vérifiez que le serveur est démarré sur le port 3000.";
        } else if (err.response?.status === 404) {
          errorMessage = "Endpoint non trouvé. Vérifiez la route /api/remblai.";
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }

        setError(errorMessage);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonctions utilitaires pour adapter les données
  const getStatusFromSituation = (situation: string) => {
    if (!situation) return 'pending';
    if (situation.includes('terminé') || situation.includes('Terminé')) return 'completed';
    if (situation.includes('en cours') || situation.includes('En cours')) return 'in_progress';
    if (situation.includes('approuvé') || situation.includes('Approuvé')) return 'approved';
    return 'pending';
  };

  const getPriorityFromData = (data: Remblai) => {
    if (data.montant > 10000) return 'high';
    if (data.montant > 5000) return 'medium';
    return 'low';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-orange-100 text-orange-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Élevée';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Basse';
      default:
        return priority;
    }
  };

  // Transformer les données
  const transformedRequests: TransformedRequest[] = requests.map((request, index) => ({
    id: `REQ-${request.id.toString().padStart(3, '0')}`,
    title: `Remblai ${request.localite || 'Non spécifié'}`,
    site: `${request.commune || 'N/A'} - ${request.localite || 'N/A'}`,
    quantity: `${request.volume || 0} m³`,
    priority: getPriorityFromData(request),
    status: getStatusFromSituation(request.situation || ''),
    requestDate: request.date_demande || new Date().toISOString().split('T')[0],
    requiredDate: request.date_echeance || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requestedBy: request.proprietaire || 'Non spécifié',
    originalData: request
  }));

  // Filtrer les demandes
  const filteredRequests = transformedRequests.filter(request => {
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    const matchesSearch = searchTerm === '' || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Gestion des modales
  const handleViewClick = (request: TransformedRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleEditClick = (request: TransformedRequest) => {
    setEditingRequest(request.originalData);
    setEditFormData({ ...request.originalData });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name.includes('montant') || name.includes('volume') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    try {
      console.log("💾 Sauvegarde des modifications:", editFormData);
      
      // Mise à jour locale (à remplacer par un appel API)
      const updatedRequests = requests.map(r => 
        r.id === editingRequest.id ? { ...r, ...editFormData } : r
      );
      
      setRequests(updatedRequests);
      setShowEditModal(false);
      alert("Modifications sauvegardées avec succès !");
      
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde des modifications.");
    }
  };

  const handleDeleteRequest = async () => {
    if (!editingRequest) return;

    if (confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
      try {
        console.log("🗑️ Suppression de la demande:", editingRequest.id);
        
        const updatedRequests = requests.filter(r => r.id !== editingRequest.id);
        setRequests(updatedRequests);
        setShowEditModal(false);
        alert("Demande supprimée avec succès !");
        
      } catch (error) {
        console.error("❌ Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de la demande.");
      }
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6 min-h-screen p-6 bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement des demandes de remblai...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 min-h-screen p-6 bg-gray-50">
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
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demandes de Remblai</h1>
          <p className="text-gray-600 mt-1">Gestion des demandes de matériaux</p>
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Nouvelle demande</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total demandes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredRequests.length}</p>
              <p className="text-xs text-gray-500 mt-1">toutes catégories</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">En attente</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {filteredRequests.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">en attente de traitement</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">En cours</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {filteredRequests.filter(r => r.status === 'in_progress').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">en cours de traitement</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Terminées</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {filteredRequests.filter(r => r.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">demandes finalisées</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-8 h-8 text-green-600" />
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
                placeholder="Rechercher par site, localité ou demandeur..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtres avancés</span>
            </button>
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'pending', label: 'En attente' },
              { key: 'approved', label: 'Approuvées' },
              { key: 'in_progress', label: 'En cours' },
              { key: 'completed', label: 'Terminées' }
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Demande</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Site</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Volume</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Priorité</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Statut</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Échéance</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Demandeur</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Opérations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono font-medium text-gray-900">{request.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{request.site}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{request.quantity}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`} />
                        <span className="text-sm text-gray-600">{getPriorityText(request.priority)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span>{getStatusText(request.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(request.requiredDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{request.requestedBy}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => handleViewClick(request)}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Modifier"
                          onClick={() => handleEditClick(request)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    Aucune demande de remblai trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="p-4 flex justify-between items-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Affichage de {Math.min(startIndex + 1, filteredRequests.length)} à {Math.min(startIndex + itemsPerPage, filteredRequests.length)} sur {filteredRequests.length} résultats
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
                disabled={currentPage === totalPages || filteredRequests.length === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de visualisation */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails de la demande</h3>
                <p className="text-gray-600 mt-1">Informations détaillées sur la demande de remblai</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informations générales
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">ID Demande:</span>
                      <span className="text-gray-900 font-mono">{selectedRequest.id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Demandeur:</span>
                      <span className="text-gray-900">{selectedRequest.requestedBy}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Date demande:</span>
                      <span className="text-gray-900">{formatDate(selectedRequest.requestDate)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Date échéance:</span>
                      <span className="text-gray-900">{formatDate(selectedRequest.requiredDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Localisation
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Site:</span>
                      <span className="text-gray-900">{selectedRequest.site}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Volume demandé:</span>
                      <span className="text-gray-900 font-mono">{selectedRequest.quantity}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Priorité:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {getPriorityText(selectedRequest.priority)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Statut:</span>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusIcon(selectedRequest.status)}
                        <span>{getStatusText(selectedRequest.status)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Informations complémentaires
                </h4>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Montant estimé:</span>
                      <p className="text-gray-900">{selectedRequest.originalData.montant ? `${selectedRequest.originalData.montant.toLocaleString()} Ar` : 'Non spécifié'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Situation:</span>
                      <p className="text-gray-900">{selectedRequest.originalData.situation || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
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
      {showEditModal && editingRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Modifier la demande</h3>
                <p className="text-gray-600 mt-1">Modification des informations de la demande de remblai</p>
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Propriétaire/Demandeur</label>
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume (m³)</label>
                    <input
                      type="number"
                      name="volume"
                      value={editFormData.volume || 0}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (Ar)</label>
                    <input
                      type="number"
                      name="montant"
                      value={editFormData.montant || 0}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situation</label>
                    <select
                      name="situation"
                      value={editFormData.situation || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une situation</option>
                      <option value="En attente">En attente</option>
                      <option value="En cours">En cours</option>
                      <option value="Approuvé">Approuvé</option>
                      <option value="Terminé">Terminé</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={handleDeleteRequest}
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

export default MaterialRequests;
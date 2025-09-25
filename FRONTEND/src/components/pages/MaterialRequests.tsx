import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import RemblaiMap from "./RemblaiMap";

const MaterialRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/remblai');
        setRequests(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonctions utilitaires pour adapter les données de la base au format attendu par le composant
  const getStatusFromSituation = (situation) => {
    if (situation?.includes('terminé') || situation?.includes('Terminé')) return 'completed';
    if (situation?.includes('en cours') || situation?.includes('En cours')) return 'in_progress';
    if (situation?.includes('approuvé') || situation?.includes('Approuvé')) return 'approved';
    return 'pending';
  };

  const getPriorityFromData = (data) => {
    if (data.montant > 10000) return 'high';
    if (data.montant > 5000) return 'medium';
    return 'low';
  };

  const getStatusIcon = (status) => {
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

  const getStatusColor = (status) => {
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

  const getStatusText = (status) => {
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

  const getPriorityColor = (priority) => {
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

  // Transformer les données de la base au format attendu par le composant
  const transformedRequests = requests.map((request, index) => ({
    id: `REQ-${request.id.toString().padStart(3, '0')}`,
    title: `Remblai ${request.localite}`,
    site: `${request.commune} - ${request.localite}`,
    quantity: `${request.volume} m³`,
    priority: getPriorityFromData(request),
    status: getStatusFromSituation(request.situation),
    requestDate: new Date().toISOString().split('T')[0],
    requiredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requestedBy: request.proprietaire || 'Non spécifié',
    originalData: request // Conserver les données originales pour référence
  }));

  // Filtrer les demandes selon l'onglet actif et le terme de recherche
  const filteredRequests = transformedRequests.filter(request => {
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    const matchesSearch = searchTerm === '' || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculer les données pour la pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  // Gérer le changement de page
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-600">Chargement des données...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Erreur lors du chargement: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Demandes de Remblai</h1>
          <p className="text-slate-600 mt-1">Gestion des demandes de matériaux</p>
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Nouvelle demande</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Total demandes</p>
              <p className="text-2xl font-bold text-slate-800">{filteredRequests.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">En cours</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredRequests.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Terminées</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredRequests.filter(r => r.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une demande..."
                className="pl-10 pr-4 py-2 w-64 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset à la première page lors d'une nouvelle recherche
                }}
              />
            </div>
            
            <button className="flex items-center space-x-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs">
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'pending', label: 'En attente' },
              { key: 'in_progress', label: 'En cours' },
              { key: 'completed', label: 'Terminées' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1); // Reset à la première page lors du changement d'onglet
                }}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Table - Taille de police réduite à 12px (text-xs) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-700">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-700">Demande</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-700">Site</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-700">Quantité</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-700">Priorité</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-700">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-700">Échéance</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-700">Demandeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentRequests.length > 0 ? (
                currentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3 text-xs font-mono text-slate-800">{request.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-800">{request.title}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{request.site}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-800">{request.quantity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`} />
                        <span className="text-xs text-slate-600 capitalize">{request.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span>{getStatusText(request.status)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{request.requiredDate}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{request.requestedBy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 text-xs">
                    Aucune demande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <div className="text-xs text-slate-600">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredRequests.length)} sur {filteredRequests.length} demandes
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Section */}
      <div className="">
        {/* <h1 className="text-3xl font-bold text-slate-800 mb-4">Carte des Remblais</h1> */}
        <RemblaiMap apiUrl="http://localhost:3000/api/remblai" />
      </div>
    </div>
  );
};

export default MaterialRequests;
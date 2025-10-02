import React, { useState, useEffect } from "react";
import { 
  Search, Edit, Eye, ChevronLeft, ChevronRight, 
  Calendar, MapPin, FileText, User, ShieldAlert, 
  AlertCircle, CheckCircle,  X, 
  Save, Trash2, FileDigit, AlertTriangle, Home,
  Clock, UserCheck
} from 'lucide-react';
import axios from 'axios';
import RendezvousComponent from "./RendezvousComponent";

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

interface Rendezvous {
  id: string;
  date: string;
  heure: string;
  lieu: string;
  objet: string;
  participants: string[];
  statut: 'planifié' | 'en_cours' | 'terminé' | 'annulé';
  notes: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Données mock pour les rendez-vous
const mockRendezvous: Rendezvous[] = [
  {
    id: '1',
    date: '2024-01-15',
    heure: '09:00',
    lieu: 'Commune d\'Antananarivo',
    objet: 'Inspection terrain - Remblai illicite',
    participants: ['Agent Dupont', 'Technicien GIS'],
    statut: 'planifié',
    notes: 'Prévoir les équipements de sécurité',
    coordinates: { lat: -18.8792, lng: 47.5079 }
  },
  {
    id: '2',
    date: '2024-01-16',
    heure: '14:30',
    lieu: 'Zone industrielle Ivato',
    objet: 'Contrôle construction sur domaine public',
    participants: ['Agent Martin', 'Expert foncier'],
    statut: 'planifié',
    notes: 'Rencontre avec le propriétaire sur site',
    coordinates: { lat: -18.7964, lng: 47.4799 }
  },
  {
    id: '3',
    date: '2024-01-10',
    heure: '10:00',
    lieu: 'Ambohidratrimo',
    objet: 'Suivi régularisation',
    participants: ['Agent Rousseau'],
    statut: 'terminé',
    notes: 'Dossier en cours de traitement'
  }
];

const FieldActionsMap: React.FC = () => {
  const [listeDescentes, setListeDescentes] = useState<Descente[]>([]);
  const [rendezvous, setRendezvous] = useState<Rendezvous[]>(mockRendezvous);
  const [infractionStats, setInfractionStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
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

  // Calcul des statistiques de rendez-vous
  useEffect(() => {
    const stats = [
      {
        categorie_consolidee: 'Rendez-vous en cours',
        nombre_de_terrains: rendezvous.filter(r => r.statut === 'en_cours').length
      },
      {
        categorie_consolidee: 'Non-comparution',
        nombre_de_terrains: rendezvous.filter(r => r.statut === 'annulé').length
      },
      {
        categorie_consolidee: 'Rendez-vous avec comparution',
        nombre_de_terrains: rendezvous.filter(r => r.statut === 'planifié').length
      },
      {
        categorie_consolidee: 'Rendez-vous terminé',
        nombre_de_terrains: rendezvous.filter(r => r.statut === 'terminé').length
      },
    ];
    setInfractionStats(stats);
    setLoadingStats(false);
  }, [rendezvous]);

  // Fonction pour obtenir l'icône et la couleur selon la catégorie
  const getCategoryStyle = (categorie: string) => {
    const categorieLower = categorie.toLowerCase();
    
    if (categorieLower.includes('en cours')) {
      return {
        color: 'bg-blue-500',
        icon: <Clock className="w-8 h-8 text-white" />,
      };
    } else if (categorieLower.includes('non-comparution')) {
      return {
        color: 'bg-red-500',
        icon: <X className="w-8 h-8 text-white" />,
      };
    } else if (categorieLower.includes('avec comparution')) {
      return {
        color: 'bg-green-500',
        icon: <UserCheck className="w-8 h-8 text-white" />,
      };
    } else if (categorieLower.includes('terminé')) {
      return {
        color: 'bg-purple-500',
        icon: <CheckCircle className="w-8 h-8 text-white" />,
      };
    } else {
      return {
        color: 'bg-gray-500',
        icon: <AlertCircle className="w-8 h-8 text-white" />,
      };
    }
  };

 

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: inputValue } = e.target;
    const value = ['x_coord', 'y_coord', 'superficie', 'montant', 'amende_reg', 'Montant_1', 'Montant_2'].includes(name) 
      ? parseFloat(inputValue) || 0 
      : inputValue;
    setEditFormData({ ...editFormData, [name]: value });
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

  // const getStatusColor = (actions: string) => {
  //   if (!actions) return 'bg-slate-100 text-slate-700';
  //   const actionsLower = String(actions).toLowerCase();
    
  //   if (actionsLower.includes('résolu') || actionsLower.includes('resolu')) {
  //     return 'bg-green-100 text-green-700';
  //   } else if (actionsLower.includes('en cours')) {
  //     return 'bg-blue-100 text-blue-700';
  //   } else if (actionsLower.includes('en attente')) {
  //     return 'bg-yellow-100 text-yellow-700';
  //   } else if (actionsLower.includes('urgent')) {
  //     return 'bg-red-100 text-red-700';
  //   } else {
  //     return 'bg-slate-100 text-slate-700';
  //   }
  // };

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
   

      {/* Statistiques par catégorie */}
      

      {/* Section Rendez-vous et Tableau en colonne */}
      <div className="flex flex-col gap-6">
        <div>
         <RendezvousComponent rendezvous={rendezvous} onRendezvousUpdate={setRendezvous}/>
        </div>
   {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listes des descentes</h1>
          <p className="text-gray-600 mt-1">Suivi des descentes et infractions constatées</p>
        </div>
      </div>
        {/* Tableau des descentes */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Recherche et Filtres */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                <div className="flex items-center space-x-3">
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
                      className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  {[
                    { key: 'all', label: 'Toutes' },
                    { key: '', label: "Aujourd'hui" },
                    { key: 'en cours', label: 'Ce mois ci' },
                    // { key: 'résolu', label: 'Résolus' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

            {/* Tableau avec taille de police réduite */}
            {isLoading ? (
              <div className="text-center p-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">Chargement des descentes...</p>
              </div>
            ) : error ? (
              <div className="text-center p-6">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 font-medium text-sm">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">Localité</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">Coord X</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">Coord Y</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">Actions</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">Infractions</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">Opérations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedDescentes.length > 0 ? (
                        paginatedDescentes.map((descente, index) => (
                          <tr key={descente.identifica || `index-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900 text-xs">
                                {formatDate(descente.date_desce)}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{descente.localite || 'N/A'}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 text-xs">{descente.x_coord || 'N/A'}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 text-xs">{descente.y_coord || 'N/A'}</td>
                            
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              <span className="line-clamp-2">
                                {descente.actions || 'Non spécifié'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(descente.infraction || '').color}`}>
                                {descente.infraction ? descente.infraction.substring(0, 20) + (descente.infraction.length > 20 ? '...' : '') : 'Non spécifié'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-1">
                                <button
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  onClick={() => handleViewClick(descente)}
                                  title="Voir les détails"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Modifier"
                                  onClick={() => handleEditClick(descente)}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-gray-500 text-sm">
                            Aucune descente trouvée.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination simplifiée avec taille réduite */}
                {filteredDescentes.length > 0 && (
                  <div className="p-3 flex justify-between items-center border-t border-gray-200">
                    <p className="text-gray-600 text-xs">
                      Affichage de {Math.min(startIndex + 1, filteredDescentes.length)} à {Math.min(startIndex + itemsPerPage, filteredDescentes.length)} sur {filteredDescentes.length} résultats
                    </p>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Précédent</span>
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || filteredDescentes.length === 0}
                        className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                      >
                        <span>Suivant</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
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
                  <MapPin className="w-5 h-5 text-blue-600" />
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
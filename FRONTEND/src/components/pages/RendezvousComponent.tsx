import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Eye, Edit, X, User, FileText, Search, Archive, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export interface Rendezvous {
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

// Type pour les statistiques des cartes
interface StatCard {
  categorie_consolidee: string;
  nombre_de_terrains: number;
}

interface RendezvousComponentProps {
  rendezvous: Rendezvous[];
  onRendezvousUpdate?: (rendezvous: Rendezvous[]) => void;
}

const RendezvousComponent: React.FC<RendezvousComponentProps> = ({ 
  rendezvous, 
  onRendezvousUpdate 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRendezvous, setSelectedRendezvous] = useState<Rendezvous | null>(null);
  const [editFormData, setEditFormData] = useState<Rendezvous | null>(null); 
  
  const [filter, setFilter] = useState<'all' | Rendezvous['statut']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRdv, setSelectedRdv] = useState<string[]>([]);
  const [expandedStatuts, setExpandedStatuts] = useState<Set<Rendezvous['statut']>>(new Set(['planifié', 'en_cours', 'terminé', 'annulé']));
  const [infractionStats, setInfractionStats] = useState<StatCard[]>([]); // Type StatCard
  const [loadingStats, setLoadingStats] = useState(true);

  // --- Fonctions utilitaires pour le statut ---

  // Obtient la couleur et l'icône principale pour le statut ou la carte statistique
  const getStatusColorAndIcon = (statutOrCategory: string) => {
    const lowerCase = statutOrCategory.toLowerCase();
    
    // Logique pour les cartes statistiques (basée sur le libellé de la catégorie)
    if (lowerCase.includes('en cours')) {
      return { color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', icon: <Clock className="w-8 h-8 text-white" /> };
    } else if (lowerCase.includes('non-comparution') || lowerCase.includes('annulé')) {
      return { color: 'bg-red-500', text: 'text-red-600', border: 'border-red-500', icon: <X className="w-8 h-8 text-white" /> };
    } else if (lowerCase.includes('avec comparution') || lowerCase.includes('planifié')) {
      return { color: 'bg-green-500', text: 'text-green-600', border: 'border-green-500', icon: <Calendar className="w-8 h-8 text-white" /> }; // Changé User pour Calendar pour Planifié
    } else if (lowerCase.includes('terminé')) {
      return { color: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500', icon: <CheckCircle className="w-8 h-8 text-white" /> };
    } else {
      return { color: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-500', icon: <AlertCircle className="w-8 h-8 text-white" /> };
    }
  };
  
  // Utilitaire pour obtenir le label lisible du statut
  const getStatutLabel = (statut: Rendezvous['statut']) => {
    switch (statut) {
      case 'planifié': return 'Planifiés';
      case 'en_cours': return 'En cours';
      case 'terminé': return 'Terminés';
      case 'annulé': return 'Annulés';
      default: return statut;
    }
  };

  // Obtient l'icône pour la liste ou le statut
  const getStatutIcon = (statut: Rendezvous['statut']) => {
    switch (statut) {
      case 'planifié': return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'en_cours': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'terminé': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'annulé': return <X className="w-5 h-5 text-red-600" />;
      default: return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  // Obtient la couleur du statut (pour les badges)
  const getStatusColor = (statut: Rendezvous['statut']) => {
    switch (statut) {
      case 'planifié': return 'bg-blue-100 text-blue-800 border-blue-400';
      case 'en_cours': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'terminé': return 'bg-green-100 text-green-800 border-green-400';
      case 'annulé': return 'bg-red-100 text-red-800 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };

  // Calcul des statistiques de rendez-vous (mise à jour du useEffect pour utiliser getStatusColorAndIcon)
  React.useEffect(() => {
    const stats: StatCard[] = [ // Utilisation du type StatCard
      {
        categorie_consolidee: 'Rendez-vous en cours',
        nombre_de_terrains: rendezvous.filter(r => r.statut === 'en_cours').length
      },
      {
        categorie_consolidee: 'Non-comparution', // Correspondent à 'annulé' dans votre logique
        nombre_de_terrains: rendezvous.filter(r => r.statut === 'annulé').length
      },
      {
        categorie_consolidee: 'Rendez-vous avec comparution', // Correspondant à 'planifié'
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

  // Formater la date (conservée, mais formatDateTime est plus utilisé pour la liste)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string, heure: string) => {
    // Gestion de la date invalide pour les nouveaux RDV non remplis complètement
    if (!dateString || !heure) return 'Date/Heure inconnue'; 
      
    const date = new Date(`${dateString}T${heure}`);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (isNaN(date.getTime())) { // Si la date est invalide
        return 'Date/Heure invalide';
    }

    if (diffInMinutes >= 0 && diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes >= 60 && diffInMinutes < 1440) {
      return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Gérer la vue des détails
  const handleViewClick = (rdv: Rendezvous) => {
    setSelectedRendezvous(rdv);
    setShowModal(true);
  };

  // Gérer l'édition
  const handleEditClick = (rdv: Rendezvous) => {
    setEditFormData(rdv);
    setShowEditModal(true);
  };

  // Mettre à jour les données dans le modal d'édition/création
  const updateFormData = (field: keyof Rendezvous, value: any) => {
    setEditFormData(prev => prev ? { ...prev, [field]: value } : null);
  };
    
  // Sauvegarder les modifications/création
  const handleSaveEdit = () => {
    if (!editFormData) return;

    // Validation minimale pour les champs requis
    const requiredFields = ['date', 'heure', 'lieu', 'objet'];
    const isComplete = requiredFields.every(field => editFormData[field as keyof Rendezvous]);
    
    if (!isComplete) {
        alert('Veuillez remplir tous les champs obligatoires (Date, Heure, Lieu, Objet).');
        return;
    }

    const updatedRendezvous = rendezvous.map(rdv => 
      rdv.id === editFormData.id ? editFormData : rdv
    );
    onRendezvousUpdate?.(updatedRendezvous);
    setShowEditModal(false);
    setEditFormData(null); // Réinitialiser l'état du formulaire
  };


  // Supprimer un rendez-vous (conservé)
  const handleDeleteRendezvous = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      const updatedRendezvous = rendezvous.filter(rdv => rdv.id !== id);
      onRendezvousUpdate?.(updatedRendezvous);
      setShowModal(false);
    }
  };

  // Marquer comme terminé (conservé)
  const markAsTermine = (id: string) => {
    const updated = rendezvous.map(rdv => 
      rdv.id === id ? { ...rdv, statut: 'terminé' } : rdv
    );
    onRendezvousUpdate?.(updated);
  };

  // Annuler (conservé)
  const annulerRdv = (id: string) => {
    const updated = rendezvous.map(rdv => 
      rdv.id === id ? { ...rdv, statut: 'annulé' } : rdv
    );
    onRendezvousUpdate?.(updated);
  };

  // Toggle selection (conservé)
  const toggleSelectRdv = (id: string) => {
    setSelectedRdv(prev =>
      prev.includes(id)
        ? prev.filter(rdvId => rdvId !== id)
        : [...prev, id]
    );
  };

  // Select all (conservé - mis à jour pour filtrer uniquement les RDV affichés)
  const selectAllRdv = () => {
    const rdvIds = filteredRendezvous.map(rdv => rdv.id);
    if (selectedRdv.length === rdvIds.length) {
      setSelectedRdv([]);
    } else {
      setSelectedRdv(rdvIds);
    }
  };

  // Archive selected (conservé)
  const archiveSelected = () => {
    const updated = rendezvous.map(rdv =>
      selectedRdv.includes(rdv.id)
        ? { ...rdv, statut: 'terminé' }
        : rdv
    );
    onRendezvousUpdate?.(updated);
    setSelectedRdv([]);
  };

  // Toggle category (statut here) (conservé)
  const toggleStatut = (statut: Rendezvous['statut']) => {
    setExpandedStatuts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(statut)) {
        newSet.delete(statut);
      } else {
        newSet.add(statut);
      }
      return newSet as Set<Rendezvous['statut']>;
    });
  };

  // Filtered RDV (conservé)
  const filteredRendezvous = rendezvous.filter(rdv => {
    const matchesFilter = filter === 'all' || rdv.statut === filter;
    const matchesSearch = 
      rdv.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdv.lieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdv.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Grouped by statut (conservé)
  const groupedRendezvous = filteredRendezvous.reduce((acc, rdv) => {
    if (!acc[rdv.statut]) {
      acc[rdv.statut] = [];
    }
    acc[rdv.statut].push(rdv);
    return acc;
  }, {} as Record<Rendezvous['statut'], Rendezvous[]>);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des rendez-vous</h1>
          <p className="text-gray-600 mt-1">Suivi des rendez-vous planifiés</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedRdv.length > 0 && (
            <button
              onClick={archiveSelected}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>Archiver ({selectedRdv.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* --- */}

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
          infractionStats.map((stat) => {
            // Utilisation de la fonction commune getStatusColorAndIcon
            const style = getStatusColorAndIcon(stat.categorie_consolidee); 
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
                    <p className="text-xs text-gray-500 mt-1">rendez-vous</p>
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
            <p className="text-gray-500">Aucune donnée de rendez-vous disponible</p>
          </div>
        )}
      </div>

      {/* --- */}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un rendez-vous..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Rendezvous['statut'] | 'all')}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="planifié">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="terminé">Terminé</option>
              <option value="annulé">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- */}

      {/* Rendez-vous List Grouped by Statut */}
      <div className="space-y-4">
        {/* On s'assure que groupedRendezvous est typé correctement */}
        {(Object.entries(groupedRendezvous) as [Rendezvous['statut'], Rendezvous[]][]).map(([statut, statutRdv]) => (
          <div key={statut} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Statut Header */}
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleStatut(statut)}
            >
              <div className="flex items-center space-x-3">
                {getStatutIcon(statut)}
                <h3 className="text-lg font-semibold text-gray-800">
                  {getStatutLabel(statut)}
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {statutRdv.length} RDV
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {expandedStatuts.has(statut) ? 'Réduire' : 'Développer'}
                </span>
                <div className={`transform transition-transform ${expandedStatuts.has(statut) ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Statut RDV */}
            {expandedStatuts.has(statut) && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={statutRdv.length > 0 && statutRdv.every(rdv => selectedRdv.includes(rdv.id))}
                          onChange={() => {
                            const allSelected = statutRdv.every(rdv => selectedRdv.includes(rdv.id));
                            if (allSelected) {
                              setSelectedRdv(prev => prev.filter(id => !statutRdv.some(rdv => rdv.id === id)));
                            } else {
                              setSelectedRdv(prev => [
                                ...prev,
                                ...statutRdv.map(rdv => rdv.id).filter(id => !prev.includes(id))
                              ]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Objet</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date/Heure</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Lieu</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Participants</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {statutRdv.map((rdv) => (
                      <tr key={rdv.id} className={`hover:bg-gray-50`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRdv.includes(rdv.id)}
                            onChange={() => toggleSelectRdv(rdv.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start space-x-3">
                            {/* Le div avec la couleur doit utiliser la classe de texte ou de border */}
                            <div className={`p-2 rounded-lg ${getStatusColorAndIcon(rdv.statut).text}/10`}> 
                              {getStatutIcon(rdv.statut)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">
                                {rdv.objet}
                              </h4>
                              {rdv.notes && (
                                <p className="text-sm text-gray-600 line-clamp-2">{rdv.notes}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDateTime(rdv.date, rdv.heure)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{rdv.lieu}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex flex-wrap gap-1">
                            {rdv.participants.map((p, i) => (
                              <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                <User className="w-3 h-3" />
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewClick(rdv)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(rdv)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {/* Ajout des boutons rapides pour changer de statut */}
                            {rdv.statut !== 'terminé' && (
                                <button
                                    onClick={() => markAsTermine(rdv.id)}
                                    className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                                    title="Terminer"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                            )}
                            {rdv.statut !== 'annulé' && rdv.statut !== 'terminé' && (
                                <button
                                    onClick={() => annulerRdv(rdv.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Annuler"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {Object.keys(groupedRendezvous).length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all'
                ? 'Aucun rendez-vous ne correspond à vos critères.' 
                : 'Vous n\'avez aucun rendez-vous pour le moment.'}
            </p>
          </div>
        )}
      </div>

      {/* --- */}

      {/* Modal de visualisation (Gardé tel quel, car correct) */}
      {showModal && selectedRendezvous && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails du rendez-vous</h3>
                <p className="text-gray-600 mt-1">Informations complètes sur le rendez-vous</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Objet</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRendezvous.objet}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(selectedRendezvous.statut)}`}>
                    {selectedRendezvous.statut.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedRendezvous.date)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Heure</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedRendezvous.heure}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Lieu</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedRendezvous.lieu}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Participants</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedRendezvous.participants.map((participant, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                      <User className="w-3 h-3" />
                      {participant}
                    </span>
                  ))}
                </div>
              </div>

              {selectedRendezvous.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Notes
                  </label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedRendezvous.notes}
                  </p>
                </div>
              )}

              {selectedRendezvous.coordinates && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coordonnées GPS</label>
                  <p className="mt-1 text-sm text-gray-900">
                    Lat: {selectedRendezvous.coordinates.lat}, Lng: {selectedRendezvous.coordinates.lng}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <button
                onClick={() => handleDeleteRendezvous(selectedRendezvous.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleEditClick(selectedRendezvous);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- */}

      {/* Modal d'édition/création */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Modifier le rendez-vous
                </h3>
                <p className="text-gray-600 mt-1">
                  Modifiez les informations du rendez-vous
                </p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={editFormData.date || ''} 
                    onChange={(e) => updateFormData('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={editFormData.heure || ''}
                    onChange={(e) => updateFormData('heure', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objet <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editFormData.objet || ''}
                  onChange={(e) => updateFormData('objet', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Objet du rendez-vous..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editFormData.lieu || ''}
                  onChange={(e) => updateFormData('lieu', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Lieu du rendez-vous..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Participants (séparés par des virgules)</label>
                <input
                  type="text"
                  value={editFormData.participants.join(', ')} 
                  onChange={(e) => {
                    const participants = e.target.value.split(',').map(p => p.trim()).filter(p => p);
                    updateFormData('participants', participants);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agent Dupont, Technicien GIS..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                    value={editFormData.statut}
                    onChange={(e) => updateFormData('statut', e.target.value as Rendezvous['statut'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="planifié">Planifié</option>
                    <option value="en_cours">En cours</option>
                    <option value="terminé">Terminé</option>
                    <option value="annulé">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                    rows={3}
                    value={editFormData.notes || ''}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes supplémentaires sur le rendez-vous..."
                />
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RendezvousComponent;
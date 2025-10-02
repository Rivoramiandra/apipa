import React, { useState } from 'react';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock,
  Filter,
  Search,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Mail,
  User,
  Calendar,
  Archive,
  Download,
  MapPin,
  Users,
  Laptop,
  Truck
} from 'lucide-react';

interface Notification {
  id: number;
  titre: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  dateCreation: string;
  dateExpiration?: string;
  emetteur: string;
  destinataire: string;
  category: 'descente_terrain' | 'rendez_vous' | 'demande_pc' | 'autorisation_camion' | 'autre';
  actions?: {
    label: string;
    action: string;
  }[];
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    titre: 'Nouvelle descente sur terrain programmée',
    message: 'Une descente sur terrain est prévue pour le 25 mars 2024 au site d\'Ambohipo pour inspection des travaux.',
    type: 'info',
    priority: 'high',
    status: 'unread',
    dateCreation: '2024-03-20T10:30:00',
    dateExpiration: '2024-03-25T23:59:59',
    emetteur: 'Service Terrain',
    destinataire: 'Équipe d\'inspection',
    category: 'descente_terrain',
    actions: [
      { label: 'Confirmer', action: 'confirm' },
      { label: 'Reporter', action: 'postpone' }
    ]
  },
  {
    id: 2,
    titre: 'Autorisation camion approuvée',
    message: 'L\'autorisation AUT-2024-015 pour Transport Rakoto SARL a été approuvée et est maintenant active.',
    type: 'success',
    priority: 'medium',
    status: 'unread',
    dateCreation: '2024-03-20T09:15:00',
    emetteur: 'Service Autorisation',
    destinataire: 'Transport Rakoto SARL',
    category: 'autorisation_camion'
  },
  {
    id: 3,
    titre: 'Rapport de descente terrain complété',
    message: 'Le rapport de la descente TER-001-2024 à Ambohipo a été finalisé et validé.',
    type: 'success',
    priority: 'low',
    status: 'read',
    dateCreation: '2024-03-19T16:45:00',
    emetteur: 'Agent Rakoto',
    destinataire: 'Superviseur terrain',
    category: 'descente_terrain'
  },
  {
    id: 4,
    titre: 'Demande de PC en attente',
    message: 'Une nouvelle demande de PC professionnel a été soumise par le service comptabilité.',
    type: 'warning',
    priority: 'high',
    status: 'unread',
    dateCreation: '2024-03-19T14:20:00',
    dateExpiration: '2024-03-22T23:59:59',
    emetteur: 'Service IT',
    destinataire: 'Responsable équipement',
    category: 'demande_pc',
    actions: [
      { label: 'Traiter', action: 'process' },
      { label: 'Rejeter', action: 'reject' }
    ]
  },
  {
    id: 5,
    titre: 'Rendez-vous client confirmé',
    message: 'Le rendez-vous avec BTP Madagascar est confirmé pour demain à 14h00.',
    type: 'info',
    priority: 'medium',
    status: 'read',
    dateCreation: '2024-03-19T11:00:00',
    emetteur: 'Secrétariat',
    destinataire: 'Commercial',
    category: 'rendez_vous'
  },
  {
    id: 6,
    titre: 'Autorisation camion expirée',
    message: 'L\'autorisation AUT-2024-003 pour BTP Madagascar a expiré. Renouvelez ou archivez le dossier.',
    type: 'warning',
    priority: 'medium',
    status: 'unread',
    dateCreation: '2024-03-19T08:30:00',
    emetteur: 'Système APIPA',
    destinataire: 'Service Autorisation',
    category: 'autorisation_camion',
    actions: [
      { label: 'Renouveler', action: 'renew' },
      { label: 'Archiver', action: 'archive' }
    ]
  },
  {
    id: 7,
    titre: 'Demande PC approuvée',
    message: 'La demande de PC pour le nouveau collaborateur a été approuvée. Livraison prévue sous 48h.',
    type: 'success',
    priority: 'medium',
    status: 'read',
    dateCreation: '2024-03-18T15:30:00',
    emetteur: 'Service IT',
    destinataire: 'Ressources Humaines',
    category: 'demande_pc'
  },
  {
    id: 8,
    titre: 'Rendez-vous annulé',
    message: 'Le rendez-vous avec Société Minière a été annulé. Une nouvelle date sera proposée.',
    type: 'warning',
    priority: 'low',
    status: 'unread',
    dateCreation: '2024-03-18T12:00:00',
    emetteur: 'Secrétariat',
    destinataire: 'Direction',
    category: 'rendez_vous'
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'descente_terrain' | 'rendez_vous' | 'demande_pc' | 'autorisation_camion' | 'autre'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['descente_terrain', 'rendez_vous', 'demande_pc', 'autorisation_camion']));

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, status: 'read' } : notif
      )
    );
  };

  const markAsUnread = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, status: 'unread' } : notif
      )
    );
  };

  const deleteNotification = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, status: 'read' }))
    );
  };

  const toggleSelectNotification = (id: number) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(notificationId => notificationId !== id)
        : [...prev, id]
    );
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(notif => notif.id));
    }
  };

  const archiveSelected = () => {
    setNotifications(prev =>
      prev.map(notif =>
        selectedNotifications.includes(notif.id)
          ? { ...notif, status: 'archived' }
          : notif
      )
    );
    setSelectedNotifications([]);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === 'all' || notif.status === filter;
    const matchesType = typeFilter === 'all' || notif.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notif.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || notif.category === categoryFilter;
    const matchesSearch = 
      notif.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.emetteur.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesType && matchesPriority && matchesCategory && matchesSearch;
  });

  // Grouper les notifications par catégorie
  const groupedNotifications = filteredNotifications.reduce((acc, notif) => {
    if (!acc[notif.category]) {
      acc[notif.category] = [];
    }
    acc[notif.category].push(notif);
    return acc;
  }, {} as Record<string, Notification[]>);

  const unreadCount = notifications.filter(notif => notif.status === 'unread').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'descente_terrain': return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'rendez_vous': return <Users className="w-5 h-5 text-green-600" />;
      case 'demande_pc': return <Laptop className="w-5 h-5 text-purple-600" />;
      case 'autorisation_camion': return <Truck className="w-5 h-5 text-orange-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'descente_terrain': return 'Descente sur terrain';
      case 'rendez_vous': return 'Rendez-vous';
      case 'demande_pc': return 'Demande PC';
      case 'autorisation_camion': return 'Autorisation camion';
      case 'autre': return 'Autre';
      default: return category;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Urgent</span>;
      case 'high':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">Élevée</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Moyenne</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Faible</span>;
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-600 mt-1">Gestion des alertes et messages du système</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedNotifications.length > 0 && (
            <button
              onClick={archiveSelected}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>Archiver ({selectedNotifications.length})</span>
            </button>
          )}
          
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={unreadCount === 0}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Tout marquer comme lu</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Total notifications</p>
              <p className="text-2xl font-bold text-slate-800">{notifications.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Non lues</p>
              <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
            </div>
            <BellRing className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Urgentes</p>
              <p className="text-2xl font-bold text-red-600">
                {notifications.filter(n => n.priority === 'urgent').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Archivées</p>
              <p className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.status === 'archived').length}
              </p>
            </div>
            <Archive className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une notification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="info">Information</option>
              <option value="success">Succès</option>
              <option value="warning">Avertissement</option>
              <option value="error">Erreur</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes priorités</option>
              <option value="urgent">Urgent</option>
              <option value="high">Élevée</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes catégories</option>
              <option value="descente_terrain">Descente terrain</option>
              <option value="rendez_vous">Rendez-vous</option>
              <option value="demande_pc">Demande PC</option>
              <option value="autorisation_camion">Autorisation camion</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List Grouped by Category */}
      <div className="space-y-4">
        {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Category Header */}
            <div 
              className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center space-x-3">
                {getCategoryIcon(category)}
                <h3 className="text-lg font-semibold text-slate-800">
                  {getCategoryLabel(category)}
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {categoryNotifications.length} notification{categoryNotifications.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-500">
                  {expandedCategories.has(category) ? 'Réduire' : 'Développer'}
                </span>
                <div className={`transform transition-transform ${expandedCategories.has(category) ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category Notifications */}
            {expandedCategories.has(category) && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={categoryNotifications.every(notif => selectedNotifications.includes(notif.id))}
                          onChange={() => {
                            const allSelected = categoryNotifications.every(notif => selectedNotifications.includes(notif.id));
                            if (allSelected) {
                              setSelectedNotifications(prev => prev.filter(id => !categoryNotifications.some(notif => notif.id === id)));
                            } else {
                              setSelectedNotifications(prev => [
                                ...prev,
                                ...categoryNotifications.map(notif => notif.id).filter(id => !prev.includes(id))
                              ]);
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Notification</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Priorité</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Émetteur</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Date</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categoryNotifications.map((notification) => (
                      <tr key={notification.id} className={`hover:bg-slate-50 ${notification.status === 'unread' ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(notification.id)}
                            onChange={() => toggleSelectNotification(notification.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}/10`}>
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className={`text-sm font-medium ${notification.status === 'unread' ? 'text-slate-900' : 'text-slate-700'}`}>
                                  {notification.titre}
                                </h4>
                                {notification.status === 'unread' && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getPriorityBadge(notification.priority)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>{notification.emetteur}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{formatDateTime(notification.dateCreation)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {notification.status === 'unread' ? (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Marquer comme lu"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => markAsUnread(notification.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                title="Marquer comme non lu"
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification(notification.id)}
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
            )}
          </div>
        ))}

        {Object.keys(groupedNotifications).length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune notification</h3>
            <p className="text-slate-500">
              {searchTerm || filter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                ? 'Aucune notification ne correspond à vos critères.' 
                : 'Vous n\'avez aucune notification pour le moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
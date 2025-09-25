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
  Download
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
  actions?: {
    label: string;
    action: string;
  }[];
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    titre: 'Nouvelle demande de remblai urgente',
    message: 'Une nouvelle demande de remblai priorité urgente vient d\'être soumise par BTP Rasoanaivo pour un projet de construction d\'immeuble résidentiel.',
    type: 'warning',
    priority: 'urgent',
    status: 'unread',
    dateCreation: '2024-03-20T10:30:00',
    dateExpiration: '2024-03-25T23:59:59',
    emetteur: 'Système APIPA',
    destinataire: 'Équipe de validation',
    actions: [
      { label: 'Examiner', action: 'review' },
      { label: 'Approuver', action: 'approve' }
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
    destinataire: 'Transport Rakoto SARL'
  },
  {
    id: 3,
    titre: 'Action sur terrain complétée',
    message: 'L\'action TER-001-2024 à Ambohipo a été marquée comme terminée. Le rapport final est disponible.',
    type: 'success',
    priority: 'low',
    status: 'read',
    dateCreation: '2024-03-19T16:45:00',
    emetteur: 'Agent Rakoto',
    destinataire: 'Superviseur terrain'
  },
  {
    id: 4,
    titre: 'Paiement en retard',
    message: 'Le paiement pour l\'autorisation AUT-2024-012 est en retard de 5 jours. Contactez le propriétaire.',
    type: 'error',
    priority: 'high',
    status: 'unread',
    dateCreation: '2024-03-19T14:20:00',
    dateExpiration: '2024-03-22T23:59:59',
    emetteur: 'Service Comptabilité',
    destinataire: 'Service Recouvrement',
    actions: [
      { label: 'Contacter', action: 'contact' },
      { label: 'Relancer', action: 'remind' }
    ]
  },
  {
    id: 5,
    titre: 'Mise à jour système',
    message: 'Une mise à jour de sécurité sera appliquée ce soir à 22h00. Le système sera indisponible pendant 30 minutes.',
    type: 'info',
    priority: 'medium',
    status: 'read',
    dateCreation: '2024-03-19T11:00:00',
    emetteur: 'Administrateur Système',
    destinataire: 'Tous les utilisateurs'
  },
  {
    id: 6,
    titre: 'Autorisation expirée',
    message: 'L\'autorisation AUT-2024-003 pour BTP Madagascar a expiré. Renouvelez ou archivez le dossier.',
    type: 'warning',
    priority: 'medium',
    status: 'unread',
    dateCreation: '2024-03-19T08:30:00',
    emetteur: 'Système APIPA',
    destinataire: 'Service Autorisation',
    actions: [
      { label: 'Renouveler', action: 'renew' },
      { label: 'Archiver', action: 'archive' }
    ]
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

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

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === 'all' || notif.status === filter;
    const matchesType = typeFilter === 'all' || notif.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notif.priority === priorityFilter;
    const matchesSearch = 
      notif.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.emetteur.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesType && matchesPriority && matchesSearch;
  });

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
          
          <div className="flex space-x-2">
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
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={selectAllNotifications}
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
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Bell className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune notification</h3>
                    <p className="text-slate-500">
                      {searchTerm || filter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Aucune notification ne correspond à vos critères.' 
                        : 'Vous n\'avez aucune notification pour le moment.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
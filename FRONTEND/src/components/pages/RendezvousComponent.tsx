import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, MapPin, Clock, Eye, X, User, FileText, Search, Archive, CheckCircle, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Rendezvous {
  id: string;
  depuisavril_id?: string;
  date_rendez_vous: string;
  heure_rendez_vous: string;
  date_desce?: string;
  heure_descente?: string;
  type_verbalisateur?: string;
  nom_verbalisateur?: string;
  personne_r: string;
  nom_personne_r: string;
  infraction: string;
  commune: string;
  fokontany: string;
  localite: string;
  coord_x?: number;
  coord_y?: number;
  statut: 'En cours' | 'Non comparution' | 'Avec comparution';
  notes?: string;
}

// Type pour les statistiques des cartes
interface StatCard {
  categorie_consolidee: string;
  nombre_de_terrains: number;
}

// Type pour la pagination par statut
interface PaginationState {
  [key: string]: number; // statut -> page number
}

const RendezvousComponent: React.FC = () => {
  const [rendezvous, setRendezvous] = useState<Rendezvous[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRendezvous, setSelectedRendezvous] = useState<Rendezvous | null>(null);
  
  const [filter, setFilter] = useState<'all' | Rendezvous['statut']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRdv, setSelectedRdv] = useState<string[]>([]);
  const [expandedStatuts, setExpandedStatuts] = useState<Set<Rendezvous['statut']>>(new Set(['En cours', 'Avec comparution', 'Non comparution']));
  const [infractionStats, setInfractionStats] = useState<StatCard[]>([]);
  const [totalRendezvous, setTotalRendezvous] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // État pour la pagination par statut
  const [pagination, setPagination] = useState<PaginationState>({
    'En cours': 1,
    'Avec comparution': 1,
    'Non comparution': 1
  });

  const statusOrder: Rendezvous['statut'][] = ['En cours', 'Avec comparution', 'Non comparution'];
  const ITEMS_PER_PAGE = 5; // 5 rendez-vous par page

  // Fetch des statistiques
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('http://localhost:3000/api/rendezvous/stats');
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      const json = await response.json();

      if (json.success) {
        const stats: StatCard[] = [
          {
            categorie_consolidee: 'Rendez-vous en cours',
            nombre_de_terrains: json.data.encours || 0
          },
          {
            categorie_consolidee: 'Rendez-vous avec comparution',
            nombre_de_terrains: json.data.aveccomparution || 0
          },
          {
            categorie_consolidee: 'Non-comparution',
            nombre_de_terrains: json.data.noncomparution || 0
          },
        ];
        setInfractionStats(stats);
        setTotalRendezvous(json.data.total || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // --- Fonctions utilitaires pour le statut ---

  const getStatusColorAndIcon = useCallback((statutOrCategory: string) => {
    const lowerCase = statutOrCategory.toLowerCase();
    
    if (lowerCase.includes('en cours') || lowerCase === 'en cours') {
      return { color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', icon: <Clock className="w-8 h-8 text-white" /> };
    } else if (lowerCase.includes('non-comparution') || lowerCase === 'non comparution') {
      return { color: 'bg-red-500', text: 'text-red-600', border: 'border-red-500', icon: <X className="w-8 h-8 text-white" /> };
    } else if (lowerCase.includes('avec comparution') || lowerCase === 'avec comparution') {
      return { color: 'bg-green-500', text: 'text-green-600', border: 'border-green-500', icon: <CheckCircle className="w-8 h-8 text-white" /> };
    } else if (lowerCase.includes('total')) {
      return { color: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-500', icon: <Calendar className="w-8 h-8 text-white" /> };
    } else {
      return { color: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-500', icon: <AlertCircle className="w-8 h-8 text-white" /> };
    }
  }, []);
  
  const getStatutLabel = useCallback((statut: Rendezvous['statut']) => {
    return statut;
  }, []);

  const getStatutIcon = useCallback((statut: Rendezvous['statut']) => {
    switch (statut) {
      case 'Avec comparution': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'En cours': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Non comparution': return <X className="w-5 h-5 text-red-600" />;
      default: return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  }, []);

  const getStatusColor = useCallback((statut: Rendezvous['statut']) => {
    switch (statut) {
      case 'Avec comparution': return 'bg-green-100 text-green-800 border-green-400';
      case 'En cours': return 'bg-blue-100 text-blue-800 border-blue-400';
      case 'Non comparution': return 'bg-red-100 text-red-800 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  }, []);

  // Fonction robuste pour parser l'heure
  const parseHeure = useCallback((heureString: string): { hours: number, minutes: number } | null => {
    if (!heureString) return null;
    
    try {
      const cleanHeure = heureString.trim();
      
      let hours: number, minutes: number;
      
      // Cas 1: Format avec séparateurs (:, h, H)
      if (cleanHeure.includes(':') || cleanHeure.includes('h') || cleanHeure.includes('H')) {
        const separator = cleanHeure.includes(':') ? ':' : (cleanHeure.includes('h') ? 'h' : 'H');
        const parts = cleanHeure.split(separator);
        
        hours = parseInt(parts[0]);
        minutes = parts[1] ? parseInt(parts[1].substring(0, 2)) : 0;
      }
      // Cas 2: Format numérique (1530 -> 15h30)
      else if (/^\d+$/.test(cleanHeure)) {
        const timeNum = parseInt(cleanHeure);
        
        if (cleanHeure.length <= 2) {
          // Juste l'heure (ex: "15")
          hours = timeNum;
          minutes = 0;
        } else if (cleanHeure.length === 3) {
          // Format HMM (ex: "830" -> 8h30)
          hours = Math.floor(timeNum / 100);
          minutes = timeNum % 100;
        } else {
          // Format HHMM (ex: "1530" -> 15h30)
          hours = Math.floor(timeNum / 100);
          minutes = timeNum % 100;
        }
      }
      // Cas 3: Format invalide
      else {
        return null;
      }
      
      // Validation
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      
      return { hours, minutes };
      
    } catch (error) {
      return null;
    }
  }, []);

  // Fonction pour créer un objet Date à partir de la date et heure du rendez-vous
  const getRendezvousDateTime = useCallback((rdv: Rendezvous): Date => {
    try {
      const cleanDate = rdv.date_rendez_vous.trim();
      const cleanTime = rdv.heure_rendez_vous.trim();
      
      if (!cleanDate || !cleanTime) {
        return new Date('invalid');
      }
      
      // Parser la date
      let day: number, month: number, year: number;
      
      if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts.length !== 3) {
          return new Date('invalid');
        }
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
      } else if (cleanDate.includes('-')) {
        const parts = cleanDate.split('-');
        if (parts.length !== 3) {
          return new Date('invalid');
        }
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          year = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
          day = parseInt(parts[2]);
        } else {
          // DD-MM-YYYY
          day = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
          year = parseInt(parts[2]);
        }
      } else {
        return new Date('invalid');
      }
      
      // S'assurer que l'année est sur 4 chiffres
      const fullYear = year < 100 ? 2000 + year : year;
      
      // Parser l'heure avec la fonction robuste
      const heureParsed = parseHeure(cleanTime);
      if (!heureParsed) {
        return new Date('invalid');
      }
      
      const { hours, minutes } = heureParsed;
      
      // Validation finale
      if (isNaN(day) || isNaN(month) || isNaN(fullYear) || isNaN(hours) || isNaN(minutes)) {
        return new Date('invalid');
      }
      
      if (day < 1 || day > 31 || month < 0 || month > 11 || fullYear < 2000 || fullYear > 2100) {
        return new Date('invalid');
      }
      
      const date = new Date(fullYear, month, day, hours, minutes);
      
      if (isNaN(date.getTime())) {
        return new Date('invalid');
      }
      
      return date;
      
    } catch (error) {
      return new Date('invalid');
    }
  }, [parseHeure]);

  // Formater la date de manière cohérente
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return 'Non spécifié';
    
    try {
      let date: Date;
      
      const cleanDate = dateString.trim();
      
      if (cleanDate.includes('/')) {
        const [dayStr, monthStr, yearStr] = cleanDate.split('/');
        const day = parseInt(dayStr);
        const month = parseInt(monthStr) - 1;
        const year = parseInt(yearStr);
        
        const fullYear = year < 100 ? 2000 + year : year;
        
        date = new Date(fullYear, month, day);
      } else if (cleanDate.includes('-')) {
        const parts = cleanDate.split('-');
        if (parts[0].length === 4) {
          date = new Date(cleanDate);
        } else {
          const [dayStr, monthStr, yearStr] = parts;
          const day = parseInt(dayStr);
          const month = parseInt(monthStr) - 1;
          const year = parseInt(yearStr);
          const fullYear = year < 100 ? 2000 + year : year;
          date = new Date(fullYear, month, day);
        }
      } else {
        return 'Format invalide';
      }
      
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }, []);

  // Formater l'heure
  const formatTime = useCallback((timeString: string): string => {
    const heureParsed = parseHeure(timeString);
    if (!heureParsed) {
      return 'Heure invalide';
    }
    
    const { hours, minutes } = heureParsed;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, [parseHeure]);

  const formatDateTime = useCallback((dateString: string, heure: string): string => {
    const formattedDate = formatDate(dateString);
    const formattedTime = formatTime(heure);
    
    if (formattedDate === 'Date invalide' || formattedTime === 'Heure invalide') {
      return 'Date/Heure invalide';
    }
    
    return `${formattedDate} à ${formattedTime}`;
  }, [formatDate, formatTime]);

  // Fonction pour calculer l'heure de fin de validation (1h après le rendez-vous) - CORRIGÉE
  const getValidationEndTime = useCallback((rdv: Rendezvous): { date: string, time: string, datetime: Date } => {
    try {
      const rdvDateTime = getRendezvousDateTime(rdv);
      
      if (isNaN(rdvDateTime.getTime())) {
        return { 
          date: 'Date invalide', 
          time: 'Heure invalide',
          datetime: new Date('invalid')
        };
      }
      
      // Calculer 1 heure après MAIS GARDER LA MÊME DATE
      const oneHourAfter = new Date(rdvDateTime.getTime() + 60 * 60 * 1000);
      
      if (isNaN(oneHourAfter.getTime())) {
        return { 
          date: 'Date invalide', 
          time: 'Heure invalide',
          datetime: new Date('invalid')
        };
      }
      
      // IMPORTANT: Toujours utiliser la date du rendez-vous, pas celle calculée
      const endDate = formatDate(rdv.date_rendez_vous); // Même date que le rendez-vous
      const endTime = oneHourAfter.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      return { 
        date: endDate, // Toujours la date du rendez-vous
        time: endTime, // Seulement l'heure +1h
        datetime: oneHourAfter
      };
    } catch (error) {
      return { 
        date: 'Erreur', 
        time: 'Erreur',
        datetime: new Date('invalid')
      };
    }
  }, [getRendezvousDateTime, formatDate]);

  // Fonction pour vérifier si le bouton de validation est cliquable
  const isValidationButtonClickable = useCallback((rdv: Rendezvous): boolean => {
    try {
      const now = new Date();
      const rdvDateTime = getRendezvousDateTime(rdv);
      
      if (isNaN(now.getTime()) || isNaN(rdvDateTime.getTime())) {
        return false;
      }
      
      const validationEnd = getValidationEndTime(rdv);
      
      if (isNaN(validationEnd.datetime.getTime())) {
        return false;
      }
      
      // Le bouton est cliquable pendant 1h après le rendez-vous
      return now >= rdvDateTime && now <= validationEnd.datetime && rdv.statut === 'En cours';
    } catch (error) {
      return false;
    }
  }, [getRendezvousDateTime, getValidationEndTime]);

  // Fonction pour vérifier si un rendez-vous devrait être en non-comparution
  const shouldBeNonComparution = useCallback((rdv: Rendezvous): boolean => {
    try {
      const now = new Date();
      const rdvDateTime = getRendezvousDateTime(rdv);
      
      if (isNaN(now.getTime()) || isNaN(rdvDateTime.getTime())) {
        return false;
      }
      
      const validationEnd = getValidationEndTime(rdv);
      
      if (isNaN(validationEnd.datetime.getTime())) {
        return false;
      }
      
      // Devrait être non-comparution si l'heure de validation est passée et toujours en cours
      return now > validationEnd.datetime && rdv.statut === 'En cours';
    } catch (error) {
      return false;
    }
  }, [getRendezvousDateTime, getValidationEndTime]);

  // Fonction pour mettre à jour le statut automatiquement vers "Non comparution"
  const handleAutoNonComparution = useCallback(async (rdvId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/rendezvous/${rdvId}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'Non comparution'
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          // Mettre à jour la liste localement
          setRendezvous(prev => prev.map(rdv => 
            rdv.id === rdvId ? { ...rdv, statut: 'Non comparution' } : rdv
          ));
          // Recharger les statistiques
          fetchStats();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour automatique du statut:', error);
    }
  }, [fetchStats]);

  // Fonction pour mettre à jour le statut manuellement
  const handleUpdateStatut = async (rdvId: string, nouveauStatut: Rendezvous['statut']) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3000/api/rendezvous/${rdvId}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: nouveauStatut
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      const json = await response.json();
      if (json.success) {
        setRendezvous(prev => prev.map(rdv => 
          rdv.id === rdvId ? { ...rdv, ...json.data } : rdv
        ));

        if (selectedRendezvous && selectedRendezvous.id === rdvId) {
          setSelectedRendezvous({ ...selectedRendezvous, ...json.data });
        }

        fetchStats();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour valider la comparution
  const handleValidationComparution = async (rdvId: string) => {
    await handleUpdateStatut(rdvId, 'Avec comparution');
  };

  // Fetch des rendez-vous
  const fetchRendezvous = useCallback(async () => {
    try {
      setIsLoading(true);
      let url = 'http://localhost:3000/api/rendezvous';
      if (searchTerm && searchTerm.trim().length >= 2) {
        url = `http://localhost:3000/api/rendezvous/search/${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      const json = await response.json();

      if (json.success) {
        setRendezvous(json.data.map((rdv: any) => ({
          ...rdv,
          id: rdv.id.toString()
        })));
      } else {
        setRendezvous([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      setRendezvous([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchRendezvous();
    fetchStats();
  }, [fetchRendezvous, fetchStats]);

  // Vérification automatique des non-comparutions
  useEffect(() => {
    const checkNonComparutions = () => {
      const now = new Date();
      let needsUpdate = false;

      rendezvous.forEach(rdv => {
        if (rdv.statut === 'En cours') {
          const validationEnd = getValidationEndTime(rdv);
          if (!isNaN(validationEnd.datetime.getTime())) {
            if (now > validationEnd.datetime) {
              handleAutoNonComparution(rdv.id);
              needsUpdate = true;
            }
          }
        }
      });
    };

    const interval = setInterval(checkNonComparutions, 30000);
    
    if (rendezvous.length > 0) {
      checkNonComparutions();
    }

    return () => clearInterval(interval);
  }, [rendezvous, getValidationEndTime, handleAutoNonComparution]);

  // Formater le lieu
  const formatLieu = useCallback((commune: string, fokontany: string, localite: string) => {
    const parts = [commune, fokontany, localite].filter(part => part && part.trim() !== '');
    return parts.join(' - ') || 'Lieu non spécifié';
  }, []);

  // Fonction sécurisée pour convertir en minuscules
  const safeToLowerCase = useCallback((value: string | undefined | null): string => {
    return value ? value.toLowerCase() : '';
  }, []);

  // Gérer la vue des détails
  const handleViewClick = useCallback(async (rdv: Rendezvous) => {
    try {
      const response = await fetch(`http://localhost:3000/api/rendezvous/${rdv.id}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          setSelectedRendezvous(json.data);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      setSelectedRendezvous(rdv);
    }
    setShowModal(true);
  }, []);

  // Toggle selection
  const toggleSelectRdv = useCallback((id: string) => {
    setSelectedRdv(prev =>
      prev.includes(id)
        ? prev.filter(rdvId => rdvId !== id)
        : [...prev, id]
    );
  }, []);

  // Filtered RDV avec useMemo pour optimiser les performances
  const filteredRendezvous = useMemo(() => {
    return rendezvous.filter(rdv => {
      const matchesFilter = filter === 'all' || rdv.statut === filter;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        safeToLowerCase(rdv.infraction).includes(searchLower) ||
        safeToLowerCase(rdv.commune).includes(searchLower) ||
        safeToLowerCase(rdv.fokontany).includes(searchLower) ||
        safeToLowerCase(rdv.nom_personne_r).includes(searchLower);
      
      return matchesFilter && matchesSearch;
    });
  }, [rendezvous, filter, searchTerm, safeToLowerCase]);

  // Select all
  const selectAllRdv = useCallback(() => {
    const rdvIds = filteredRendezvous.map(rdv => rdv.id);
    if (selectedRdv.length === rdvIds.length) {
      setSelectedRdv([]);
    } else {
      setSelectedRdv(rdvIds);
    }
  }, [filteredRendezvous, selectedRdv.length]);

  // Toggle category
  const toggleStatut = useCallback((statut: Rendezvous['statut']) => {
    setExpandedStatuts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(statut)) {
        newSet.delete(statut);
      } else {
        newSet.add(statut);
      }
      return newSet;
    });
  }, []);

  // Grouped by statut avec useMemo
  const { groupedRendezvous, sortedGroups } = useMemo(() => {
    const grouped = filteredRendezvous.reduce((acc, rdv) => {
      if (!acc[rdv.statut]) {
        acc[rdv.statut] = [];
      }
      acc[rdv.statut].push(rdv);
      return acc;
    }, {} as Record<Rendezvous['statut'], Rendezvous[]>);

    const sorted = Object.entries(grouped).sort(
      (a, b) => statusOrder.indexOf(a[0] as Rendezvous['statut']) - statusOrder.indexOf(b[0] as Rendezvous['statut'])
    );

    return { groupedRendezvous: grouped, sortedGroups: sorted };
  }, [filteredRendezvous]);

  // Fonctions pour la pagination
  const getPaginatedRendezvous = useCallback((rdvList: Rendezvous[], statut: Rendezvous['statut']) => {
    const currentPage = pagination[statut] || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return rdvList.slice(startIndex, endIndex);
  }, [pagination]);

  const getTotalPages = useCallback((rdvList: Rendezvous[]) => {
    return Math.ceil(rdvList.length / ITEMS_PER_PAGE);
  }, []);

  const handlePageChange = useCallback((statut: Rendezvous['statut'], newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [statut]: newPage
    }));
  }, []);

  // Loading state pour le tableau principal
  if (isLoading && rendezvous.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des rendez-vous</h1>
            <p className="text-gray-600 mt-1">Suivi des rendez-vous planifiés</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen p-6 bg-gray-50" >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600 mt-1">Suivi des rendez-vous planifiés</p>
        </div>
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
          <>
            {infractionStats.map((stat) => {
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
            })}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total rendez-vous
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {totalRendezvous}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">rendez-vous</p>
                </div>
                <div className="p-3 rounded-full bg-indigo-500">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-4 text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucune donnée de rendez-vous disponible</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par infraction, commune, fokontany..."
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
              <option value="En cours">En cours</option>
              <option value="Avec comparution">Avec comparution</option>
              <option value="Non comparution">Non comparution</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rendez-vous List Grouped by Statut */}
      <div className="space-y-4">
        {sortedGroups.map(([statut, statutRdv]) => {
          const currentPage = pagination[statut] || 1;
          const totalPages = getTotalPages(statutRdv);
          const paginatedRdv = getPaginatedRendezvous(statutRdv, statut as Rendezvous['statut']);

          return (
            <div key={statut} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Statut Header */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleStatut(statut as Rendezvous['statut'])}
              >
                <div className="flex items-center space-x-3">
                  {getStatutIcon(statut as Rendezvous['statut'])}
                  <h3 className="text-lg font-semibold text-gray-800">
                    {getStatutLabel(statut as Rendezvous['statut'])}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {statutRdv.length} RDV
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {expandedStatuts.has(statut as Rendezvous['statut']) ? 'Réduire' : 'Développer'}
                  </span>
                  <div className={`transform transition-transform ${expandedStatuts.has(statut as Rendezvous['statut']) ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Statut RDV */}
              {expandedStatuts.has(statut as Rendezvous['statut']) && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={paginatedRdv.length > 0 && paginatedRdv.every(rdv => selectedRdv.includes(rdv.id))}
                            onChange={selectAllRdv}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Infraction</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date/Heure</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Lieu</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Participant</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedRdv.map((rdv) => {
                        const validationEnd = getValidationEndTime(rdv);
                        const isEligibleForValidation = isValidationButtonClickable(rdv);
                        const shouldBeAutoNonComparution = shouldBeNonComparution(rdv);
                        
                        return (
                          <tr key={rdv.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRdv.includes(rdv.id)}
                                onChange={() => toggleSelectRdv(rdv.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${getStatusColorAndIcon(rdv.statut).text}/10`}> 
                                  {getStatutIcon(rdv.statut)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {rdv.infraction || 'Infraction non spécifiée'}
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
                                <span>{formatDateTime(rdv.date_rendez_vous, rdv.heure_rendez_vous)}</span>
                                {rdv.statut === 'En cours' && (
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    isEligibleForValidation
                                      ? 'bg-green-100 text-green-800'
                                      : shouldBeAutoNonComparution
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isEligibleForValidation
                                      ? 'Validable maintenant'
                                      : shouldBeAutoNonComparution
                                      ? 'Bientôt non comparution'
                                      : 'À venir'}
                                  </span>
                                )}
                                {(rdv.statut === 'Avec comparution' || rdv.statut === 'Non comparution') && (
                                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                                    Statut final
                                  </span>
                                )}
                              </div>
                              {rdv.statut === 'En cours' && shouldBeAutoNonComparution && (
                                <div className="text-xs text-orange-600 mt-1">
                                  ⚠️ Sera marqué automatiquement comme non comparution
                                </div>
                              )}
                              {(rdv.statut === 'Avec comparution' || rdv.statut === 'Non comparution') && (
                                <div className="text-xs text-gray-600 mt-1">
                                  ✅ Statut définitif
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{formatLieu(rdv.commune, rdv.fokontany, rdv.localite)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex flex-wrap gap-1">
                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                  <User className="w-3 h-3" />
                                  {rdv.nom_personne_r || 'Non spécifié'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewClick(rdv)}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Voir les détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                {/* Bouton de validation UNIQUEMENT pour "En cours" et pendant la période de validation */}
                                {rdv.statut === 'En cours' && (
                                  <button
                                    onClick={() => handleValidationComparution(rdv.id)}
                                    disabled={!isEligibleForValidation || isLoading}
                                    className={`p-1 transition-colors ${
                                      isEligibleForValidation && !isLoading
                                        ? 'text-green-400 hover:text-green-600 cursor-pointer'
                                        : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                    title={
                                      isEligibleForValidation
                                        ? 'Valider la comparution'
                                        : `Validation disponible du ${formatDate(rdv.date_rendez_vous)} ${formatTime(rdv.heure_rendez_vous)} au ${validationEnd.date} ${validationEnd.time}`
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination pour chaque statut - SEULEMENT BOUTONS PRECEDENT/SUIVANT */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
                      <div className="text-sm text-gray-700">
                        Affichage de {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, statutRdv.length)} sur {statutRdv.length} rendez-vous
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(statut as Rendezvous['statut'], currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Précédent</span>
                        </button>
                        
                        <button
                          onClick={() => handlePageChange(statut as Rendezvous['statut'], currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                            currentPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <span>Suivant</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sortedGroups.length === 0 && (
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

      {/* Modal de visualisation avec tous les champs */}
      {showModal && selectedRendezvous && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
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

            <div className="p-6 space-y-6">
              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations du rendez-vous</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRendezvous.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">DepuisAvril ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRendezvous.depuisavril_id || 'Non spécifié'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date rendez-vous</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedRendezvous.date_rendez_vous)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Heure rendez-vous</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(selectedRendezvous.heure_rendez_vous)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Infraction</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRendezvous.infraction}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(selectedRendezvous.statut)}`}>
                        {getStatutLabel(selectedRendezvous.statut)}
                        {(selectedRendezvous.statut === 'Avec comparution' || selectedRendezvous.statut === 'Non comparution') && (
                          <span className="ml-1">✓</span>
                        )}
                      </span>
                      {(selectedRendezvous.statut === 'Avec comparution' || selectedRendezvous.statut === 'Non comparution') && (
                        <p className="text-xs text-gray-600 mt-1">Statut définitif</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations de descente</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date descente</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRendezvous.date_desce ? formatDate(selectedRendezvous.date_desce) : 'Non spécifiée'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Heure descente</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRendezvous.heure_descente ? formatTime(selectedRendezvous.heure_descente) : 'Non spécifiée'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type verbalisateur</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRendezvous.type_verbalisateur || 'Non spécifié'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom verbalisateur</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRendezvous.nom_verbalisateur || 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Localisation et participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Localisation</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Commune</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedRendezvous.commune}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fokontany</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRendezvous.fokontany}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Localité</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRendezvous.localite || 'Non spécifiée'}
                      </p>
                    </div>
                    {(selectedRendezvous.coord_x || selectedRendezvous.coord_y) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Coordonnées GPS</label>
                        <p className="mt-1 text-sm text-gray-900">
                          X: {selectedRendezvous.coord_x || 'N/A'}, Y: {selectedRendezvous.coord_y || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Participants</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Personne responsable</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRendezvous.personne_r}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom personne responsable</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedRendezvous.nom_personne_r}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton de validation UNIQUEMENT pour "En cours" */}
              {selectedRendezvous.statut === 'En cours' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">Validation de comparution</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleValidationComparution(selectedRendezvous.id)}
                      disabled={!isValidationButtonClickable(selectedRendezvous) || isLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isValidationButtonClickable(selectedRendezvous) && !isLoading
                          ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Validation...' : 'Valider la comparution'}
                    </button>
                  </div>
                  {!isValidationButtonClickable(selectedRendezvous) && (
                    <p className="text-sm text-blue-700 mt-2">
                      ⏰ Validation disponible du {formatDate(selectedRendezvous.date_rendez_vous)} {formatTime(selectedRendezvous.heure_rendez_vous)} 
                      au {getValidationEndTime(selectedRendezvous).date} {getValidationEndTime(selectedRendezvous).time}
                    </p>
                  )}
                </div>
              )}

              {/* Message pour les statuts définitifs */}
              {(selectedRendezvous.statut === 'Avec comparution' || selectedRendezvous.statut === 'Non comparution') && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Statut définitif</h4>
                  <p className="text-gray-700">
                    Ce rendez-vous a un statut définitif et ne peut plus être modifié.
                    {selectedRendezvous.statut === 'Avec comparution' && ' La comparution a été validée.'}
                    {selectedRendezvous.statut === 'Non comparution' && ' La période de validation est terminée.'}
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedRendezvous.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedRendezvous.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RendezvousComponent;
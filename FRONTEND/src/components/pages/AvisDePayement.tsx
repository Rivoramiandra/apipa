import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Search,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileCheck,
  Filter,
  XCircle,
  AlertTriangle,
  Archive,
  DollarSign,
  MapPin,
  Info,
  Building,
  Map,
  Ruler,
  CreditCard,
  ShieldAlert,
  Timer,
  Send,
  User
} from 'lucide-react';
import FaireAPComponent, { FTData } from './FaireAPComponent';
import PasserPaiement, { PaymentDetails } from './PasserPaiement';

// Interface pour les données AP basée sur votre table avisdepaiment
export interface APData {
  // Champs de base
  id: number;
  id_ft_table: number;
  reference_ft: string;
  date_ft: string;
  heure_ft: string;
  infraction: string;
  status_dossier: string;
  statut: 'en cours' | 'traité' | 'archivé' | 'annulé' | 'en attente de paiement' | 'non comparution';
 
  // Informations AP
  num_ap: string;
  date_ap: string;
  date_descente: string;
 
  // Informations terrain
  titre_terrain: string;
  superficie: number;
  localite: string;
  zone_geographique: string;
  pu_plan_urbanisme: string;
  destination_terrain: string;
 
  // Informations paiement
  delai_payment: string | { days: number };
  date_delai_payment: string;
  contact: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;

  // Pour la mise en demeure
  is_mise_en_demeure?: boolean;
  nom_personne_r?: string;
  commune?: string;
  fokontany?: string;
}

// Interface pour la réponse API
interface APIResponse {
  success: boolean;
  message: string;
  data: APData[];
}

// Interface pour les stats
interface Stats {
  total: number;
  avecInfraction: number;
  sansInfraction: number;
  enCours: number;
  traite: number;
  archive: number;
  annule: number;
  enAttentePaiement: number;
  nonComparution: number;
}

// Type pour les statistiques des cartes
interface StatCard {
  categorie: string;
  nombre: number;
  pourcentage: number;
  couleur: string;
  icone: JSX.Element;
  statut: string;
}

// Type pour la pagination par statut
interface PaginationState {
  [key: string]: number;
}

/* -------------------------------------------------------------------------- */
/* COMPOSANT MODAL DE VISUALISATION */
/* -------------------------------------------------------------------------- */

const ViewModal: React.FC<{ ap: APData | null, onClose: () => void, formatters: any }> = ({ ap, onClose, formatters }) => {
  if (!ap) return null;
  const { formatDate, formatTime, getStatutBadge, translateStatut, formatSuperficie, formatDelaiPayment } = formatters;
  
  const DetailItem: React.FC<{ icon: JSX.Element, label: string, value: any }> = ({ icon, label, value }) => (
    <div className="flex items-start text-sm text-gray-700 space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="text-blue-500 flex-shrink-0 pt-1">{icon}</div>
      <div className="w-full">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        <p className="whitespace-pre-wrap">{value || 'Non spécifié'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-[85vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white z-10 rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Eye className="w-6 h-6 text-blue-600" />
              <span>Détails Avis de Paiement : {ap.reference_ft}</span>
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">Informations complètes sur l'avis de paiement.</p>
        </div>
        
        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-grow">
          {/* Section I: Informations Générales */}
          <div className="md:col-span-2 space-y-4 border-b pb-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Informations Générales</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem icon={<FileText className="w-5 h-5" />} label="ID AP" value={ap.id} />
              <DetailItem icon={<FileText className="w-5 h-5" />} label="ID FT" value={ap.id_ft_table} />
              <DetailItem icon={<FileText className="w-5 h-5" />} label="Référence FT" value={ap.reference_ft} />
              <DetailItem icon={<FileText className="w-5 h-5" />} label="Numéro AP" value={ap.num_ap || 'Non attribué'} />
              <DetailItem icon={<Calendar className="w-5 h-5" />} label="Date du FT" value={formatDate(ap.date_ft)} />
              <DetailItem icon={<Clock className="w-5 h-5" />} label="Heure du FT" value={formatTime(ap.heure_ft)} />
              <DetailItem icon={<Calendar className="w-5 h-5" />} label="Date AP" value={formatDate(ap.date_ap)} />
              <DetailItem icon={<Calendar className="w-5 h-5" />} label="Date Descente" value={formatDate(ap.date_descente)} />
              <DetailItem icon={<Info className="w-5 h-5" />} label="Status Dossier" value={ap.status_dossier || 'Non spécifié'} />
              <div className='sm:col-span-2 lg:col-span-3'>
                <DetailItem
                  icon={getStatutBadge(ap.statut).icon}
                  label="Statut AP"
                  value={
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatutBadge(ap.statut).color}`}>
                      {translateStatut(ap.statut)}
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          {/* Section II: Informations Terrain */}
          <div className="md:col-span-2 space-y-4 border-b pb-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Informations Terrain</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem icon={<FileText className="w-5 h-5" />} label="Titre Terrain" value={ap.titre_terrain || 'Non spécifié'} />
              <DetailItem icon={<Ruler className="w-5 h-5" />} label="Superficie" value={formatSuperficie(ap.superficie)} />
              <DetailItem icon={<MapPin className="w-5 h-5" />} label="Localité" value={ap.localite || 'Non spécifié'} />
              <DetailItem icon={<MapPin className="w-5 h-5" />} label="Zone Géographique" value={ap.zone_geographique || 'Non spécifié'} />
              <DetailItem icon={<Map className="w-5 h-5" />} label="Plan d'Urbanisme" value={ap.pu_plan_urbanisme || 'Non spécifié'} />
              <DetailItem icon={<Building className="w-5 h-5" />} label="Destination Terrain" value={ap.destination_terrain || 'Non spécifié'} />
            </div>
          </div>

          {/* Section III: Informations Paiement */}
          <div className="md:col-span-2 space-y-4 border-b pb-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Informations Paiement</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem icon={<Calendar className="w-5 h-5" />} label="Délai Paiement (Interval)" value={formatDelaiPayment(ap.delai_payment)} />
              <DetailItem icon={<Calendar className="w-5 h-5" />} label="Date Délai Paiement" value={ap.date_delai_payment ? formatDate(ap.date_delai_payment) : 'Non spécifié'} />
            </div>
          </div>

          {/* Section IV: Timestamps */}
          <div className="md:col-span-2 space-y-4 border-b pb-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Historique</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <DetailItem icon={<Calendar className="w-5 h-5" />} label="Date de Création" value={formatDate(ap.created_at)} />
              <DetailItem icon={<Calendar className="w-5 h-5" />} label="Dernière Modification" value={formatDate(ap.updated_at)} />
            </div>
          </div>

          {/* Section V: Infraction */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Infraction</h4>
            <DetailItem
              icon={<AlertCircle className="w-5 h-5" />}
              label="Description de l'infraction"
              value={ap.infraction || 'Aucune infraction spécifiée'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPOSANT PRINCIPAL */
/* -------------------------------------------------------------------------- */

const ListeAP: React.FC = () => {
  const [apList, setApList] = useState<APData[]>([]);
  const [filteredList, setFilteredList] = useState<APData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAP, setSelectedAP] = useState<APData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedStatut, setSelectedStatut] = useState<string>('tous');
  const [creatingAP, setCreatingAP] = useState(false);
  const [expandedStatuts, setExpandedStatuts] = useState<Set<string>>(
    new Set(['en cours', 'traité', 'archivé', 'annulé', 'en attente de paiement', 'non comparution', 'Ready'])
  );
  const [stats, setStats] = useState<Stats>({
    total: 0,
    avecInfraction: 0,
    sansInfraction: 0,
    enCours: 0,
    traite: 0,
    archive: 0,
    annule: 0,
    enAttentePaiement: 0,
    nonComparution: 0
  });
  const [pagination, setPagination] = useState<PaginationState>({
    'en cours': 1,
    'traité': 1,
    'archivé': 1,
    'annulé': 1,
    'en attente de paiement': 1,
    'non comparution': 1,
    'Ready': 1
  });

  // États pour la mise en demeure
  const [sendingMiseEnDemeure, setSendingMiseEnDemeure] = useState<number | null>(null);
  const [selectedRdv, setSelectedRdv] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // État pour le modal Faire AP
  const [createAPModal, setCreateAPModal] = useState<{
    show: boolean;
    ft: FTData | null;
  }>({
    show: false,
    ft: null
  });

  // État pour le modal de paiement
  const [paymentModal, setPaymentModal] = useState<{
    show: boolean;
    ap: APData | null;
  }>({
    show: false,
    ap: null
  });

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkingOverdue, setCheckingOverdue] = useState(false);

  const ITEMS_PER_PAGE = 5;

  /* -------------------------- Fonctions Utilitaires ------------------------- */
  
  // Utilisation de useMemo pour les formateurs
  const formatters = useMemo(() => {
    // Fonction pour obtenir la couleur du badge selon le statut
    const getStatutBadge = (statut: string) => {
      const styles = {
        'en cours': {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-5 h-5 text-yellow-600" />
        },
        'traité': {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />
        },
        'archivé': {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Archive className="w-5 h-5 text-blue-600" />
        },
        'annulé': {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <X className="w-5 h-5 text-red-600" />
        },
        'en attente de paiement': {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Clock className="w-5 h-5 text-orange-600" />
        },
        'non comparution': {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <ShieldAlert className="w-5 h-5 text-purple-600" />
        }
      };
    
      return styles[statut as keyof typeof styles] || {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <FileText className="w-5 h-5 text-gray-600" />
      };
    };

    // Fonction pour traduire le statut
    const translateStatut = (statut: string) => {
      const translations: { [key: string]: string } = {
        'en cours': 'En cours',
        'traité': 'Traité',
        'archivé': 'Archivé',
        'annulé': 'Annulé',
        'en attente de paiement': 'En attente de paiement',
        'non comparution': 'Non comparution'
      };
    
      return translations[statut] || statut;
    };

    // Formater la date
    const formatDate = (dateString: string): string => {
      try {
        if (!dateString) return 'Non spécifiée';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch {
        return dateString || 'Non spécifiée';
      }
    };

    // Formater l'heure
    const formatTime = (timeString: string): string => {
      try {
        if (!timeString) return 'Non spécifiée';
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return timeString || 'Non spécifiée';
      }
    };

    // Formater la superficie
    const formatSuperficie = (superficie: number): string => {
      if (!superficie) return '0 m²';
      return new Intl.NumberFormat('fr-FR').format(superficie) + ' m²';
    };

    // Formater delai_payment
    const formatDelaiPayment = (delai: APData['delai_payment']) => {
      if (typeof delai === 'string') {
        return delai;
      } else if (delai && typeof delai === 'object' && 'days' in delai) {
        return `${delai.days} jours`;
      }
      return 'Non spécifié';
    };

    // Formater date et heure
    const formatDateTime = (date: string, time: string): string => {
      return `${formatDate(date)} ${formatTime(time)}`;
    };

    // Formater le lieu
    const formatLieu = (commune?: string, fokontany?: string, localite?: string): string => {
      const parts = [commune, fokontany, localite].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Non spécifié';
    };

    // Obtenir la couleur du statut
    const getStatusColor = (statut: string): string => {
      const colors: { [key: string]: string } = {
        'en cours': 'bg-yellow-100 text-yellow-800',
        'traité': 'bg-green-100 text-green-800',
        'archivé': 'bg-blue-100 text-blue-800',
        'annulé': 'bg-red-100 text-red-800',
        'en attente de paiement': 'bg-orange-100 text-orange-800',
        'non comparution': 'bg-purple-100 text-purple-800'
      };
      return colors[statut] || 'bg-gray-100 text-gray-800';
    };

    return {
      getStatutBadge,
      translateStatut,
      formatDate,
      formatTime,
      formatSuperficie,
      formatDelaiPayment,
      formatDateTime,
      formatLieu,
      getStatusColor
    };
  }, []);

  const {
    getStatutBadge,
    translateStatut,
    formatDate,
    formatTime,
    formatSuperficie,
    formatDelaiPayment,
    formatDateTime,
    formatLieu,
    getStatusColor
  } = formatters;

  /* ---------------------------- Fonctions de Fetch --------------------------- */
  
  // Fonction pour récupérer les données
  const fetchAPData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
    
      console.log('🔄 Tentative de récupération des AP...');
    
      // Essayer les deux endpoints possibles
      const endpoints = [
        'http://localhost:3000/api/faireap',
        'http://localhost:3000/api/aps'
      ];
    
      let response = null;
      let data = null;
    
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Essai de l'endpoint: ${endpoint}`);
          response = await fetch(endpoint);
        
          if (response.ok) {
            data = await response.json();
            console.log(`✅ Données récupérées depuis: ${endpoint}`, data);
            break;
          } else {
            console.log(`❌ Endpoint ${endpoint} retourne: ${response.status}`);
          }
        } catch (err) {
          console.log(`❌ Échec de l'endpoint ${endpoint}:`, err);
          continue;
        }
      }
    
      if (!response || !response.ok) {
        throw new Error('Aucun endpoint API accessible pour récupérer les AP');
      }
    
      if (data.success) {
        setApList(data.data);
      
        // Calcul des statistiques
        const avecInfraction = data.data.filter((ap: APData) =>
          ap.infraction && ap.infraction.trim() !== ''
        ).length;
      
        const enCours = data.data.filter((ap: APData) => ap.statut === 'en cours').length;
        const traite = data.data.filter((ap: APData) => ap.statut === 'traité').length;
        const archive = data.data.filter((ap: APData) => ap.statut === 'archivé').length;
        const annule = data.data.filter((ap: APData) => ap.statut === 'annulé').length;
        const enAttentePaiement = data.data.filter((ap: APData) => ap.statut === 'en attente de paiement').length;
        const nonComparution = data.data.filter((ap: APData) => ap.statut === 'non comparution').length;
      
        setStats({
          total: data.data.length,
          avecInfraction,
          sansInfraction: data.data.length - avecInfraction,
          enCours,
          traite,
          archive,
          annule,
          enAttentePaiement,
          nonComparution
        });
      
        applyFilters(data.data, searchTerm, selectedStatut);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des données');
      }
    } catch (err) {
      console.error('❌ Erreur fetch AP:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatut]);

  // Fonction pour appliquer les filtres
  const applyFilters = useCallback((list: APData[], search: string, statut: string) => {
    let filtered = list;
   
    // Filtre par recherche
    if (search.trim()) {
      filtered = filtered.filter(ap =>
        ap.reference_ft?.toLowerCase().includes(search.toLowerCase()) ||
        ap.infraction?.toLowerCase().includes(search.toLowerCase()) ||
        ap.date_ft?.toLowerCase().includes(search.toLowerCase()) ||
        ap.id_ft_table?.toString().includes(search) ||
        ap.status_dossier?.toLowerCase().includes(search.toLowerCase()) ||
        ap.num_ap?.toLowerCase().includes(search.toLowerCase()) ||
        ap.titre_terrain?.toLowerCase().includes(search.toLowerCase()) ||
        ap.localite?.toLowerCase().includes(search.toLowerCase())
      );
    }
   
    // Filtre par statut
    if (statut !== 'tous') {
      filtered = filtered.filter(ap => ap.statut === statut);
    }
   
    setFilteredList(filtered);
   
    // Réinitialiser la pagination pour tous les statuts
    setPagination({
      'en cours': 1,
      'traité': 1,
      'archivé': 1,
      'annulé': 1,
      'en attente de paiement': 1,
      'non comparution': 1,
      'Ready': 1
    });
  }, []);

  // Effet pour charger les données au montage
  useEffect(() => {
    fetchAPData();
  }, [fetchAPData]);

  // Effet pour appliquer les filtres
  useEffect(() => {
    applyFilters(apList, searchTerm, selectedStatut);
  }, [searchTerm, selectedStatut, apList, applyFilters]);

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedStatut('tous');
  }, []);

  /* ---------------------------- Fonctions d'Actions -------------------------- */
  
  // Fonction pour vérifier les AP en retard
  const checkOverdueAPs = async () => {
    try {
      setCheckingOverdue(true);
      console.log('🔄 Vérification des AP en retard...');
      
      const response = await fetch('http://localhost:3000/api/aps/overdue/force-check', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification des AP en retard');
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Vérification terminée:', result.message);
        // Rafraîchir les données
        await fetchAPData();
        
        // Afficher un message de succès
        alert(result.message);
      } else {
        throw new Error(result.message || 'Erreur lors de la vérification');
      }
    } catch (err) {
      console.error('❌ Erreur vérification AP en retard:', err);
      alert('Erreur lors de la vérification des AP en retard');
    } finally {
      setCheckingOverdue(false);
    }
  };

  // Fonction pour ouvrir le modal de détails
  const openDetailModal = useCallback((ap: APData) => {
    setSelectedAP(ap);
    setShowDetailModal(true);
  }, []);

  // Fonction pour fermer le modal
  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedAP(null);
  }, []);

  // Fonction pour ouvrir le modal Faire AP
  const openCreateAPModal = useCallback(async (ap: APData) => {
    setCreatingAP(true);
    try {
      let ftData: FTData;
    
      console.log(`🔄 Tentative de récupération du FT ID: ${ap.id_ft_table}`);
    
      // Essayer de récupérer les données complètes du FT depuis le bon endpoint
      const endpoints = [
        `http://localhost:3000/api/ft/${ap.id_ft_table}`,
        `http://localhost:3000/api/ft_table/${ap.id_ft_table}`,
        `http://localhost:3000/api/faireap/ft/${ap.id_ft_table}`
      ];
    
      let response = null;
      let data = null;
    
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Essai de l'endpoint: ${endpoint}`);
          response = await fetch(endpoint);
        
          if (response.ok) {
            data = await response.json();
            console.log(`✅ Données FT récupérées depuis: ${endpoint}`, data);
            break;
          } else {
            console.log(`❌ Endpoint ${endpoint} retourne: ${response.status}`);
          }
        } catch (err) {
          console.log(`❌ Échec de l'endpoint ${endpoint}:`, err);
          continue;
        }
      }
    
      if (!response || !response.ok) {
        throw new Error(`Aucun endpoint API accessible pour récupérer le FT ID ${ap.id_ft_table}`);
      }
    
      if (data.success) {
        ftData = data.data;
        setCreateAPModal({ show: true, ft: ftData });
      } else {
        throw new Error(data.message || 'Données FT non disponibles');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal Faire AP:', error);
      const basicFtData: FTData = {
        id: ap.id_ft_table,
        rendezvous_id: 0,
        reference_ft: ap.reference_ft,
        date_ft: ap.date_ft,
        heure_ft: ap.heure_ft,
        type_convoquee: 'Contrôle',
        nom_complet: 'Contrevenant à préciser',
        cin: '',
        contact: '',
        adresse: '',
        commune: 'Commune à préciser',
        dossier_type: [],
        infraction: ap.infraction,
        status_dossier: ap.status_dossier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
     
      setCreateAPModal({ show: true, ft: basicFtData });
    } finally {
      setCreatingAP(false);
    }
  }, []);

  const closeCreateAPModal = useCallback(() => {
    setCreateAPModal({ show: false, ft: null });
  }, []);

  // Fonction pour ouvrir le modal de paiement
  const openPaymentModal = useCallback((ap: APData) => {
    setPaymentModal({ show: true, ap });
  }, []);

  // Fonction pour fermer le modal de paiement
  const closePaymentModal = useCallback(() => {
    setPaymentModal({ show: false, ap: null });
    setPaymentLoading(false);
  }, []);

  // Fonction pour gérer le paiement
  const handlePaymentSubmit = async (paymentDetails: PaymentDetails) => {
    try {
      setPaymentLoading(true);
      console.log('🔄 Envoi du paiement:', paymentDetails);
      
      // Exemple de fetch vers un endpoint de paiement
      const response = await fetch('http://localhost:3000/api/paiements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentDetails,
          ap_id: paymentModal.ap?.id,
          reference_ft: paymentModal.ap?.reference_ft,
          num_ap: paymentModal.ap?.num_ap
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement du paiement');
      }
      
      const data = await response.json();
      console.log('✅ Paiement enregistré:', data);
      
      // Rafraîchir la liste des AP
      fetchAPData();
      
      // Fermer le modal
      closePaymentModal();
      
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      // Gérer l'erreur (vous pourriez afficher un message d'erreur dans le modal)
    } finally {
      setPaymentLoading(false);
    }
  };

  // Toggle category
  const toggleStatut = useCallback((statut: string) => {
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
  const { groupedAP, sortedGroups } = useMemo(() => {
    const grouped = filteredList.reduce((acc, ap) => {
      const statut = ap.statut;
      if (!acc[statut]) {
        acc[statut] = [];
      }
      acc[statut].push(ap);
      return acc;
    }, {} as Record<string, APData[]>);

    const sorted = Object.entries(grouped).sort((a, b) => {
      const order = ['en cours', 'traité', 'en attente de paiement', 'non comparution', 'archivé', 'annulé'];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    });

    return { groupedAP: grouped, sortedGroups: sorted };
  }, [filteredList]);

  // Fonctions pour la pagination
  const getPaginatedAP = useCallback((apList: APData[], statut: string) => {
    const currentPage = pagination[statut] || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return apList.slice(startIndex, endIndex);
  }, [pagination]);

  const getPaginatedRendezvous = useCallback((rdvList: APData[], statut: string) => {
    const currentPage = pagination[statut] || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return rdvList.slice(startIndex, endIndex);
  }, [pagination]);

  const getTotalPages = useCallback((apList: APData[]) => {
    return Math.ceil(apList.length / ITEMS_PER_PAGE);
  }, []);

  const handlePageChange = useCallback((statut: string, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [statut]: newPage
    }));
  }, []);

  // Fonctions pour la mise en demeure
  const envoyerMiseEnDemeure = async (apId: number) => {
    try {
      setSendingMiseEnDemeure(apId);
      console.log(`🔄 Envoi de mise en demeure pour l'AP ID: ${apId}`);
      
      const response = await fetch('http://localhost:3000/api/aps/mise-en-demeure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ap_id: apId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la mise en demeure');
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Mise en demeure envoyée:', result.message);
        // Rafraîchir les données
        await fetchAPData();
        
        // Afficher un message de succès
        alert('Mise en demeure envoyée avec succès');
      } else {
        throw new Error(result.message || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('❌ Erreur envoi mise en demeure:', err);
      alert('Erreur lors de l\'envoi de la mise en demeure');
    } finally {
      setSendingMiseEnDemeure(null);
    }
  };

  const toggleSelectRdv = (rdvId: number) => {
    setSelectedRdv(prev => 
      prev.includes(rdvId) 
        ? prev.filter(id => id !== rdvId)
        : [...prev, rdvId]
    );
  };

  const handleViewClick = (rdv: APData) => {
    openDetailModal(rdv);
  };

  const handleOpenMiseEnDemeureModal = (rdv: APData) => {
    envoyerMiseEnDemeure(rdv.id);
  };

  // Filtrer les non-comparution prêtes pour mise en demeure
  const nonComparutionReady = useMemo(() => {
    return filteredList.filter(ap => 
      ap.statut === 'non comparution' 
      // Ajoutez ici d'autres critères pour déterminer si c'est "prêt"
    );
  }, [filteredList]);

  // Statistiques pour les cartes
  const statCards = useMemo((): StatCard[] => [
    {
      categorie: 'Total AP',
      nombre: stats.total,
      pourcentage: 100,
      couleur: 'bg-indigo-500',
      icone: <FileText className="w-8 h-8 text-white" />,
      statut: 'tous'
    },
    {
      categorie: 'En Cours',
      nombre: stats.enCours,
      pourcentage: stats.total > 0 ? Math.round((stats.enCours / stats.total) * 100) : 0,
      couleur: 'bg-yellow-500',
      icone: <Clock className="w-8 h-8 text-white" />,
      statut: 'en cours'
    },
    {
      categorie: 'Traité',
      nombre: stats.traite,
      pourcentage: stats.total > 0 ? Math.round((stats.traite / stats.total) * 100) : 0,
      couleur: 'bg-green-500',
      icone: <CheckCircle className="w-8 h-8 text-white" />,
      statut: 'traité'
    },
    {
      categorie: 'En attente paiement',
      nombre: stats.enAttentePaiement,
      pourcentage: stats.total > 0 ? Math.round((stats.enAttentePaiement / stats.total) * 100) : 0,
      couleur: 'bg-orange-500',
      icone: <Clock className="w-8 h-8 text-white" />,
      statut: 'en attente de paiement'
    },
    {
      categorie: 'Non comparution',
      nombre: stats.nonComparution,
      pourcentage: stats.total > 0 ? Math.round((stats.nonComparution / stats.total) * 100) : 0,
      couleur: 'bg-purple-500',
      icone: <ShieldAlert className="w-8 h-8 text-white" />,
      statut: 'non comparution'
    }
  ], [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Chargement des avis de paiement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAPData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center mx-auto"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modal Faire AP */}
        {createAPModal.show && createAPModal.ft && (
          <FaireAPComponent
            ft={createAPModal.ft}
            onClose={closeCreateAPModal}
            onUpdate={() => {
              closeCreateAPModal();
              fetchAPData();
            }}
          />
        )}

        {/* Modal de Visualisation */}
        <ViewModal
          ap={selectedAP}
          onClose={closeDetailModal}
          formatters={formatters}
        />

        {/* Modal de Paiement */}
        {paymentModal.show && paymentModal.ap && (
          <PasserPaiement
            ap={paymentModal.ap}
            onClose={closePaymentModal}
            onSuccess={() => {
              closePaymentModal();
              fetchAPData();
            }}
            loading={paymentLoading}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Avis de Paiement (AP)</h1>
            <p className="text-gray-600 mt-1">Gestion et consultation des avis de paiement par statut</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Bouton pour vérifier les AP en retard */}
            <button
              onClick={checkOverdueAPs}
              disabled={checkingOverdue}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {checkingOverdue ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <Timer className="w-4 h-4" />
                  <span>Vérifier retards</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {statCards.map((stat) => (
            <div
              key={stat.categorie}
              className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:scale-105 ${
                selectedStatut === stat.statut ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedStatut(stat.statut)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.categorie}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.nombre}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.pourcentage}% du total</p>
                </div>
                <div className={`p-3 rounded-full ${stat.couleur}`}>
                  {stat.icone}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicateur du filtre actif */}
        {(selectedStatut !== 'tous' || searchTerm) && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">
                  Filtres actifs :
                  {selectedStatut !== 'tous' && (
                    <span className="ml-1">
                      Statut: <strong>{translateStatut(selectedStatut)}</strong>
                    </span>
                  )}
                  {searchTerm && (
                    <span className="ml-1">
                      {selectedStatut !== 'tous' ? 'et ' : ''}
                      Recherche: <strong>"{searchTerm}"</strong>
                    </span>
                  )}
                  <span className="ml-2">
                    ({filteredList.length} résultat{filteredList.length > 1 ? 's' : ''})
                  </span>
                </span>
              </div>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                Supprimer les filtres
              </button>
            </div>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par référence, numéro AP, infraction, localité, titre terrain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          
            <div className="flex items-center gap-3">
              {/* Sélecteur de statut */}
              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tous">Tous les statuts</option>
                <option value="en cours">En cours</option>
                <option value="traité">Traité</option>
                <option value="en attente de paiement">En attente de paiement</option>
                <option value="non comparution">Non comparution</option>
                <option value="archivé">Archivé</option>
                <option value="annulé">Annulé</option>
              </select>
            
              <button
                onClick={fetchAPData}
                className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section dédiée pour les non-comparution prêtes pour mise en demeure (affichées en cards) */}
        {nonComparutionReady.length > 0 && (
          <div key="ready" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleStatut('Ready')}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Prêts pour mise en demeure
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  {nonComparutionReady.length} RDV
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {expandedStatuts.has('Ready') ? 'Réduire' : 'Développer'}
                </span>
                <div className={`transform transition-transform ${expandedStatuts.has('Ready') ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Cards */}
            {expandedStatuts.has('Ready') && (
              <div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getPaginatedRendezvous(nonComparutionReady, 'Ready').map((rdv) => (
                    <div key={rdv.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <input
                          type="checkbox"
                          checked={selectedRdv.includes(rdv.id)}
                          onChange={() => toggleSelectRdv(rdv.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(rdv.statut)}`}>
                            {rdv.statut}
                          </span>
                          {/* BADGE POUR LES MISE EN DEMEURE EXISTANTES */}
                          {rdv.is_mise_en_demeure && (
                            <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800 border border-orange-300">
                              📧 Mise en demeure
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {rdv.infraction || 'Infraction non spécifiée'}
                      </h4>
                      <div className="text-sm text-gray-600 flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDateTime(rdv.date_ft, rdv.heure_ft)}</span>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{formatLieu(rdv.commune, rdv.fokontany, rdv.localite)}</span>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{rdv.nom_personne_r || 'Non spécifié'}</span>
                      </div>
                      <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleViewClick(rdv)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenMiseEnDemeureModal(rdv)}
                          disabled={isLoading}
                          className={`text-xs font-medium px-2 py-1 rounded transition ${
                            !isLoading
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title="Envoyer la mise en demeure de non comparution"
                        >
                          Envoyer Mise en Demeure
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {getTotalPages(nonComparutionReady) > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
                    <div className="text-sm text-gray-700">
                      Affichage de {((pagination['Ready'] - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(pagination['Ready'] * ITEMS_PER_PAGE, nonComparutionReady.length)} sur {nonComparutionReady.length} rendez-vous
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange('Ready', pagination['Ready'] - 1)}
                        disabled={pagination['Ready'] === 1}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                          pagination['Ready'] === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Précédent</span>
                      </button>
                      <button
                        onClick={() => handlePageChange('Ready', pagination['Ready'] + 1)}
                        disabled={pagination['Ready'] === getTotalPages(nonComparutionReady)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                          pagination['Ready'] === getTotalPages(nonComparutionReady)
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
        )}

        {/* Liste des AP Groupés par Statut */}
        <div className="space-y-4">
          {sortedGroups.map(([statut, statutAP]) => {
            const currentPage = pagination[statut] || 1;
            const totalPages = getTotalPages(statutAP);
            const paginatedAP = getPaginatedAP(statutAP, statut);

            return (
              <div key={statut} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Statut Header */}
                <div
                  className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors bg-gray-50"
                  onClick={() => toggleStatut(statut)}
                >
                  <div className="flex items-center space-x-3">
                    {getStatutBadge(statut).icon}
                    <h3 className="text-lg font-semibold text-gray-800">
                      {translateStatut(statut)}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {statutAP.length} A.P.
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

                {/* Statut AP */}
                {expandedStatuts.has(statut) && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Référence FT</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Numéro AP</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date/Heure</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Infraction</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status Dossier</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedAP.map((ap) => (
                          <tr key={ap.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {ap.reference_ft}
                                  </h4>
                                  <p className="text-sm text-gray-600">ID: {ap.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {ap.num_ap ? (
                                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  {ap.num_ap}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Non attribué</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{formatDate(ap.date_ft)}</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>{formatTime(ap.heure_ft)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {ap.infraction ? (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                                  <AlertCircle className="w-3 h-3" />
                                  {ap.infraction.length > 50 ? `${ap.infraction.substring(0, 50)}...` : ap.infraction}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Non spécifiée</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {ap.status_dossier || 'Non spécifié'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => openDetailModal(ap)}
                                  className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                                  title="Voir les détails"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                              
                                {/* Bouton Faire AP pour en cours */}
                                {ap.statut === 'en cours' && (
                                  <button
                                    onClick={() => openCreateAPModal(ap)}
                                    disabled={creatingAP}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    title="Créer un avis de paiement"
                                  >
                                    <FileCheck className="w-4 h-4" />
                                    <span>{creatingAP ? 'Chargement...' : 'Faire AP'}</span>
                                  </button>
                                )}
                                {/* Bouton Passer au paiement pour en attente de paiement */}
                                {ap.statut === 'en attente de paiement' && (
                                  <button
                                    onClick={() => openPaymentModal(ap)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    title="Passer au paiement"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                    <span>Passer au paiement</span>
                                  </button>
                                )}
                                {/* Bouton Envoyer mise en demeure pour non comparution */}
                                {ap.statut === 'non comparution' && (
                                  <button
                                    onClick={() => envoyerMiseEnDemeure(ap.id)}
                                    disabled={sendingMiseEnDemeure === ap.id}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    title="Envoyer une mise en demeure"
                                  >
                                    {sendingMiseEnDemeure === ap.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                    <span>
                                      {sendingMiseEnDemeure === ap.id ? 'Envoi...' : 'Mise en demeure'}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                   
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center p-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Page {currentPage} de {totalPages}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePageChange(statut, currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg text-gray-600 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handlePageChange(statut, currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg text-gray-600 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
         
          {apList.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun avis de paiement trouvé pour les critères actuels.</p>
              <button
                onClick={fetchAPData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Réessayer le chargement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListeAP;
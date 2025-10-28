import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, MapPin, Clock, Eye, X, User, FileText, Search, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Edit, Trash2, Archive, Home, Building, Target, CheckSquare, Square, Info, ServerCrash, AlertTriangle } from 'lucide-react';

// Interface pour les données F.T. - AJOUT du champ deadline_complement
export interface FTData {
  id: number;
  rendezvous_id: number;
  reference_ft: string;
  date_ft: string;
  heure_ft: string;
  type_convoquee: string;
  nom_complet: string;
  cin: string;
  contact: string;
  adresse: string;
  titre_terrain?: string;
  nomproprietaire?: string; // MODIFICATION: 'im' remplacé par 'nomproprietaire'
  localisation?: string;
  superficie?: number;
  motif?: string;
  lieu?: string;
  but?: string;
  mesure?: string;
  dossier_type: string[];
  id_descente?: string;
  num_pv?: string;
  commune: string;
  fokotany?: string;
  localite?: string;
  coord_x?: number;
  coord_y?: number;
  infraction?: string;
  dossier?: string;
  status_dossier: 'En cours' | 'Traité' | 'Archivé' | 'Annulé';
  missing_dossiers?: string[];
  deadline_complement?: string; // AJOUT: Date limite pour compléter les dossiers
  duration_complement?: number; // AJOUT: Durée en jours pour compléter
  created_at: string;
  updated_at: string;
}

// Type pour les statistiques des cartes
interface StatCard {
  categorie_consolidee: string;
  nombre_de_dossiers: number;
  pourcentage: number;
  couleur: string;
  icone: JSX.Element;
}

// Type pour la pagination par statut
interface PaginationState {
  [key: string]: number;
}

// Type pour le suivi des dossiers cochés
interface CheckedDossiersState {
  [ftId: number]: string[];
}

// Types pour le Modal de Confirmation
interface ConfirmationModalState {
  show: boolean;
  title: string;
  message: string;
  action: () => void;
}

/* -------------------------------------------------------------------------- */
/* COMPOSANTS UI                               */
/* -------------------------------------------------------------------------- */

// Composant Modal de Confirmation (simulé)
const ConfirmationModal: React.FC<{ modal: ConfirmationModalState, closeModal: () => void, executeAction: () => void }> = ({ modal, closeModal, executeAction }) => {
  if (!modal.show) return null;

  const handleConfirm = () => {
    executeAction();
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 p-4 transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full transition-transform transform scale-100">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">{modal.title}</h3>
          </div>
          <p className="text-gray-700 mb-6">{modal.message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Modal de Visualisation (détails)
const ViewModal: React.FC<{ ft: FTData | null, onClose: () => void, formatters: any }> = ({ ft, onClose, formatters }) => {
  if (!ft) return null;

  const { formatDate, formatTime, formatDossierTypes, formatMissingDossiers, getStatusColorAndIcon, getStatutLabel, isDeadlinePassed } = formatters;

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-[50vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white z-10 rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Eye className="w-6 h-6 text-blue-600" />
              <span>Détails F.T. : {ft.reference_ft}</span>
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">Informations complètes sur le dossier Fitanana an-tsoratra.</p>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-grow">
          {/* Section I: Rendez-vous et Personne Convoquée */}
          <div className="md:col-span-2 space-y-4 border-b pb-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Informations Générales</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <DetailItem icon={<Calendar className="w-5 h-5" />} label="Date du F.T." value={formatDate(ft.date_ft)} />
              <DetailItem icon={<Clock className="w-5 h-5" />} label="Heure du F.T." value={formatTime(ft.heure_ft)} />
              <DetailItem icon={<User className="w-5 h-5" />} label="Nom Complet Convoqué" value={ft.nom_complet} />
              <DetailItem icon={<FileText className="w-5 h-5" />} label="Type Convoqué" value={ft.type_convoquee} />
              <DetailItem icon={<Info className="w-5 h-5" />} label="CIN/Contact" value={`${ft.cin} / ${ft.contact}`} />
              <DetailItem icon={<MapPin className="w-5 h-5" />} label="Adresse Convoqué" value={ft.adresse} />
              <div className='sm:col-span-2'>
                <DetailItem 
                  icon={getStatusColorAndIcon(ft.status_dossier).icon} 
                  label="Statut du Dossier" 
                  value={<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColorAndIcon(ft.status_dossier).color}`}>{getStatutLabel(ft.status_dossier)}</span>}
                />
              </div>
            </div>
          </div>

          {/* Section II: Localisation et Terrain */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Localisation & Terrain</h4>
            <DetailItem icon={<Home className="w-5 h-5" />} label="Commune / Fokotany / Localité" value={`${ft.commune} / ${ft.fokotany || 'N/A'} / ${ft.localite || 'N/A'}`} />
            <DetailItem icon={<Target className="w-5 h-5" />} label="Coordonnées (X, Y)" value={ft.coord_x && ft.coord_y ? `${ft.coord_x}, ${ft.coord_y}` : 'Non spécifié'} />
            <DetailItem icon={<Building className="w-5 h-5" />} label="Titre Terrain / Nom Propriétaire" value={ft.titre_terrain && ft.nomproprietaire ? `${ft.titre_terrain} (Propriétaire: ${ft.nomproprietaire})` : 'Non spécifié'} />
            <DetailItem icon={<Square className="w-5 h-5" />} label="Superficie / Localisation" value={ft.superficie ? `${ft.superficie} m² / ${ft.localisation || 'N/A'}` : 'Non spécifié'} />
          </div>

          {/* Section III: Motif et Mesures */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Motif et Suivi</h4>
            <DetailItem icon={<FileText className="w-5 h-5" />} label="Types de Dossier" value={formatDossierTypes(ft.dossier_type)} />
            <DetailItem icon={<Info className="w-5 h-5" />} label="Motif / Lieu / But" value={`${ft.motif || 'N/A'} / ${ft.lieu || 'N/A'} / ${ft.but || 'N/A'}`} />
            <DetailItem icon={<CheckSquare className="w-5 h-5" />} label="Mesures prises" value={ft.mesure} />
            <DetailItem icon={<AlertCircle className="w-5 h-5" />} label="Infraction" value={ft.infraction} />
          </div>

          {/* Section IV: Documents et PV */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">Documents et PV</h4>
            <DetailItem icon={<FileText className="w-5 h-5" />} label="Dossiers Manquants" value={formatMissingDossiers(ft)} />
            <DetailItem icon={<FileText className="w-5 h-5" />} label="Numéro PV / ID Descente" value={ft.num_pv && ft.id_descente ? `PV: ${ft.num_pv} / ID Descente: ${ft.id_descente}` : 'Non spécifié'} />
            
            {/* AJOUT: Affichage de la date limite */}
            {ft.deadline_complement && (
              <DetailItem 
                icon={<AlertTriangle className="w-5 h-5" />} 
                label="Date limite pour compléter" 
                value={
                  <div className={`flex items-center space-x-2 ${
                    isDeadlinePassed(ft.deadline_complement) ? 'text-red-600 font-semibold' : 'text-orange-600'
                  }`}>
                    <span>{formatDate(ft.deadline_complement)}</span>
                    {isDeadlinePassed(ft.deadline_complement) && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        DÉPASSÉE
                      </span>
                    )}
                  </div>
                }
              />
            )}
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
/* COMPOSANT PRINCIPAL                           */
/* -------------------------------------------------------------------------- */

const FTComponent: React.FC = () => {
  const [ftList, setFtList] = useState<FTData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFT, setSelectedFT] = useState<FTData | null>(null);
    
  const [filter, setFilter] = useState<'all' | FTData['status_dossier'] | 'deadline_passed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFTs, setSelectedFTs] = useState<number[]>([]);
  const [expandedStatuts, setExpandedStatuts] = useState<Set<string>>(
    new Set(['Régularisé', 'Irrégularisé', 'Date limite dépassée'])
  );
  const [stats, setStats] = useState<StatCard[]>([]);
  const [totalFT, setTotalFT] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
    
  const [checkedDossiers, setCheckedDossiers] = useState<CheckedDossiersState>({});
    
  const [pagination, setPagination] = useState<PaginationState>({
    'Régularisé': 1,
    'Irrégularisé': 1,
    'Date limite dépassée': 1
  });

  // État pour Confirmation Modal seulement
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    show: false,
    title: '',
    message: '',
    action: () => {},
  });

  const ITEMS_PER_PAGE = 5;

  /* ---------------------- Fonctions de Modals ---------------------- */

  // Fonction pour ouvrir le modal de confirmation
  const openConfirmationModal = useCallback((title: string, message: string, action: () => void) => {
    setConfirmationModal({ show: true, title, message, action });
  }, []);

  // Fonction pour fermer le modal de confirmation
  const closeConfirmationModal = useCallback(() => {
    setConfirmationModal({ show: false, title: '', message: '', action: () => {} });
  }, []);

  /* -------------------------- Fonctions Utilitaires ------------------------- */

  // Utilisation de useMemo pour les formateurs, passés au modal de vue
  const formatters = useMemo(() => {
    // Fonction pour déterminer si un dossier est régularisé
    const isDossierRegularise = (ft: FTData): boolean => {
      return !ft.missing_dossiers || ft.missing_dossiers.length === 0;
    };
  
    // Fonction pour obtenir le statut de régularisation
    const getStatutRegularisation = (ft: FTData): string => {
      return isDossierRegularise(ft) ? 'Régularisé' : 'Irrégularisé';
    };
  
    // Fonction pour obtenir la couleur du statut de régularisation
    const getStatutRegularisationColor = (ft: FTData): string => {
      return isDossierRegularise(ft)  
        ? 'bg-green-100 text-green-800 border-green-400'  
        : 'bg-red-100 text-red-800 border-red-400';
    };
  
    // Fonctions utilitaires pour le statut
    const getStatusColorAndIcon = (statut: FTData['status_dossier']) => {
      switch (statut) {
        case 'Traité':
          return {  
            color: 'bg-green-100 text-green-800 border-green-400',
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            badge: 'bg-green-100 text-green-800'
          };
        case 'En cours':
          return {  
            color: 'bg-blue-100 text-blue-800 border-blue-400',
            icon: <Clock className="w-5 h-5 text-blue-600" />,
            badge: 'bg-blue-100 text-blue-800'
          };
        case 'Archivé':
          return {  
            color: 'bg-gray-100 text-gray-800 border-gray-400',
            icon: <Archive className="w-5 h-5 text-gray-600" />,
            badge: 'bg-gray-100 text-gray-800'
          };
        case 'Annulé':
          return {  
            color: 'bg-red-100 text-red-800 border-red-400',
            icon: <X className="w-5 h-5 text-red-600" />,
            badge: 'bg-red-100 text-red-800'
          };
        default:
          return {  
            color: 'bg-gray-100 text-gray-800 border-gray-400',
            icon: <FileText className="w-5 h-5 text-gray-600" />,
            badge: 'bg-gray-100 text-gray-800'
          };
      }
    };
  
    const getStatutLabel = (statut: FTData['status_dossier']) => {
      return statut;
    };
  
    // Formater la date
    const formatDate = (dateString: string): string => {
      if (!dateString) return 'Non spécifié';
      
      try {
        const date = new Date(dateString);
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
    };
  
    // Formater l'heure
    const formatTime = (timeString: string): string => {
      if (!timeString) return 'Non spécifié';
      
      try {
        const time = new Date(`2000-01-01T${timeString}`);
        if (isNaN(time.getTime())) {
          return 'Heure invalide';
        }
        
        return time.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'Heure invalide';
      }
    };
  
    // Formater les types de dossier
    const formatDossierTypes = (types: string[]): string => {
      if (!types || types.length === 0) return 'Aucun type spécifié';
      return types.join(', ');
    };
  
    // Formater les dossiers manquants
    const formatMissingDossiers = (ft: FTData): string => {
      if (isDossierRegularise(ft)) {
        return 'Aucun dossier manquant';
      }
      
      if (ft.missing_dossiers && ft.missing_dossiers.length > 0) {
        return ft.missing_dossiers.join(', ');
      }
      
      return 'Aucun dossier manquant';
    };
    
    // Fonction utilitaire pour vérifier si un dossier a des dossiers manquants
    const hasMissingDossiers = (ft: FTData) => {
      return ft.missing_dossiers && ft.missing_dossiers.length > 0;
    };

    // NOUVELLE FONCTION: Vérifier si la date limite est dépassée
    const isDeadlinePassed = (deadline: string): boolean => {
      if (!deadline) return false;
      try {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadlineDate < today;
      } catch {
        return false;
      }
    };

    // NOUVELLE FONCTION: Vérifier si un FT a une date limite dépassée
    const hasDeadlinePassed = (ft: FTData): boolean => {
      return ft.deadline_complement ? isDeadlinePassed(ft.deadline_complement) : false;
    };

    return { 
      isDossierRegularise, getStatutRegularisation, getStatutRegularisationColor, 
      getStatusColorAndIcon, getStatutLabel, formatDate, formatTime, 
      formatDossierTypes, formatMissingDossiers, hasMissingDossiers,
      isDeadlinePassed, hasDeadlinePassed // AJOUT des nouvelles fonctions
    };
  }, []);

  const {
    isDossierRegularise, getStatutRegularisation, getStatutRegularisationColor, 
    getStatusColorAndIcon, getStatutLabel, formatDate, formatTime, 
    formatDossierTypes, formatMissingDossiers, hasMissingDossiers,
    isDeadlinePassed, hasDeadlinePassed
  } = formatters;
  
  /* ---------------------------- Fonctions de Fetch --------------------------- */

  // Fetch des statistiques - VERSION SIMPLIFIÉE SANS TOAST
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      console.log('🔄 Tentative de récupération des statistiques...');
      
      // ESSAYER D'ABORD L'API RÉELLE
      try {
        const response = await fetch('http://localhost:3000/api/ft/stats');
        
        if (response.ok) {
          const json = await response.json();
          console.log('✅ API Stats fonctionne:', json);
          
          if (json.success && json.data) {
            // UTILISER LES VRAIES DONNÉES DE L'API
            const apiStats = json.data;
            
            const statsData: StatCard[] = [
              {
                categorie_consolidee: 'Dossiers Régularisés',
                nombre_de_dossiers: apiStats.dossiers_regularises,
                pourcentage: apiStats.pourcentage_regularises,
                couleur: 'bg-green-500',
                icone: <CheckCircle className="w-8 h-8 text-white" />
              },
              {
                categorie_consolidee: 'Dossiers Irrégularisés',
                nombre_de_dossiers: apiStats.dossiers_irregularises,
                pourcentage: apiStats.pourcentage_irregularises,
                couleur: 'bg-orange-500',
                icone: <AlertCircle className="w-8 h-8 text-white" />
              },
              {
                categorie_consolidee: 'En Cours',
                nombre_de_dossiers: apiStats.en_cours,
                pourcentage: apiStats.pourcentage_en_cours,
                couleur: 'bg-blue-500',
                icone: <Clock className="w-8 h-8 text-white" />
              },
              {
                categorie_consolidee: 'Total F.T.',
                nombre_de_dossiers: apiStats.total,
                pourcentage: 100,
                couleur: 'bg-indigo-500',
                icone: <FileText className="w-8 h-8 text-white" />
              }
            ];
            
            setStats(statsData);
            setTotalFT(apiStats.total);
            return; // Sortir si l'API fonctionne
          }
        } else {
          console.log('❌ API Stats retourne une erreur:', response.status);
          throw new Error(`Erreur ${response.status}`);
        }
      } catch (apiError) {
        console.log('❌ Erreur API Stats:', apiError);
        // Continuer vers les données mockées en cas d'erreur
      }
      
      // FALLBACK : DONNÉES MOCKÉES SEULEMENT SI L'API ÉCHOUE
      console.log('📊 Utilisation des données mockées (backend en erreur)');
      
      const mockStats = {
        total: 12,
        en_cours: 8,
        dossiers_regularises: 7,
        dossiers_irregularises: 5,
        pourcentage_regularises: 58,
        pourcentage_irregularises: 42,
        pourcentage_en_cours: 67
      };
      
      const statsData: StatCard[] = [
        {
          categorie_consolidee: 'Dossiers Régularisés',
          nombre_de_dossiers: mockStats.dossiers_regularises,
          pourcentage: mockStats.pourcentage_regularises,
          couleur: 'bg-green-500',
          icone: <CheckCircle className="w-8 h-8 text-white" />
        },
        {
          categorie_consolidee: 'Dossiers Irrégularisés',
          nombre_de_dossiers: mockStats.dossiers_irregularises,
          pourcentage: mockStats.pourcentage_irregularises,
          couleur: 'bg-orange-500',
          icone: <AlertCircle className="w-8 h-8 text-white" />
        },
        {
          categorie_consolidee: 'En Cours',
          nombre_de_dossiers: mockStats.en_cours,
          pourcentage: mockStats.pourcentage_en_cours,
          couleur: 'bg-blue-500',
          icone: <Clock className="w-8 h-8 text-white" />
        },
        {
          categorie_consolidee: 'Total F.T.',
          nombre_de_dossiers: mockStats.total,
          pourcentage: 100,
          couleur: 'bg-indigo-500',
          icone: <FileText className="w-8 h-8 text-white" />
        }
      ];
      
      setStats(statsData);
      setTotalFT(mockStats.total);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch des F.T.
  const fetchFT = useCallback(async () => {
    try {
      setIsLoading(true);
      let url = 'http://localhost:3000/api/ft';
      if (searchTerm && searchTerm.trim().length >= 2) {
        url = `http://localhost:3000/api/ft/search/${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      
      const json = await response.json();

      if (json.success) {
        setFtList(json.data);
        setCheckedDossiers({});
      } else {
        setFtList([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des F.T.:', error);
      setFtList([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchFT();
    fetchStats();
  }, [fetchFT, fetchStats]);

  /* ---------------------------- Fonctions d'Actions -------------------------- */

  // Fonction pour cocher/décocher un dossier
  const toggleDossierCheck = useCallback((ftId: number, dossier: string) => {
    setCheckedDossiers(prev => {
      const currentChecked = prev[ftId] || [];
      const isCurrentlyChecked = currentChecked.includes(dossier);
      
      if (isCurrentlyChecked) {
        return {
          ...prev,
          [ftId]: currentChecked.filter(d => d !== dossier)
        };
      } else {
        return {
          ...prev,
          [ftId]: [...currentChecked, dossier]
        };
      }
    });
  }, []);

  // Fonction pour valider les dossiers cochés
  const handleValidateCheckedDossiers = useCallback(async (ftId: number) => {
    const checked = checkedDossiers[ftId] || [];
    if (checked.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const ft = ftList.find(f => f.id === ftId);
      if (!ft) return;

      const currentMissing = ft.missing_dossiers || [];
      const updatedMissing = currentMissing.filter(d => !checked.includes(d));
      
      const response = await fetch(`http://localhost:3000/api/ft/${ftId}/missing-dossiers`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ missing_dossiers: updatedMissing }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation des dossiers');
      }

      const json = await response.json();
      
      if (json.success) {
        setFtList(prev => prev.map(ft => {
          if (ft.id === ftId) {
            return json.data;
          }
          return ft;
        }));
        
        setCheckedDossiers(prev => ({
          ...prev,
          [ftId]: []
        }));
        
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur lors de la validation des dossiers:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [checkedDossiers, ftList, fetchStats]);

  // Fonction pour ajouter un dossier manquant
  const handleAddMissingDossier = useCallback(async (ftId: number, dossier: string) => {
    if (!dossier.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`http://localhost:3000/api/ft/${ftId}/missing-dossiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dossier: dossier.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du dossier manquant');
      }

      const json = await response.json();
      
      if (json.success) {
        setFtList(prev => prev.map(ft => {
          if (ft.id === ftId) {
            const currentMissing = ft.missing_dossiers || [];
            return {
              ...ft,
              missing_dossiers: [...currentMissing, dossier.trim()]
            };
          }
          return ft;
        }));
        
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du dossier manquant:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchStats]);

  // Gérer la vue des détails
  const handleViewClick = useCallback(async (ft: FTData) => {
    try {
      // Re-fetch des détails pour s'assurer que les données sont les plus récentes
      const response = await fetch(`http://localhost:3000/api/ft/${ft.id}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          setSelectedFT(json.data);
          setShowModal(true);
          return;
        }
      }
      // Si le fetch échoue ou n'est pas successful, utiliser l'objet FT existant
      setSelectedFT(ft);
      setShowModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      setSelectedFT(ft); // Afficher les détails locaux en cas d'erreur réseau
      setShowModal(true);
    }
  }, []);

  // Gérer la demande de suppression
  const requestDelete = useCallback((ftId: number, reference: string) => {
    openConfirmationModal(
      'Confirmation de Suppression',
      `Êtes-vous sûr de vouloir supprimer le F.T. ${reference} (ID: ${ftId}) ? Cette action est irréversible.`,
      () => handleDeleteConfirm(ftId)
    );
  }, [openConfirmationModal]);

  // Exécuter la suppression après confirmation
  const handleDeleteConfirm = useCallback(async (ftId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3000/api/ft/${ftId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      const json = await response.json();
      if (json.success) {
        setFtList(prev => prev.filter(ft => ft.id !== ftId));
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du F.T.:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats]);
  
  // Fonction pour obtenir le nombre de dossiers cochés pour un FT
  const getCheckedCount = useCallback((ftId: number) => {
    return (checkedDossiers[ftId] || []).length;
  }, [checkedDossiers]);

  // Toggle selection
  const toggleSelectFT = useCallback((id: number) => {
    setSelectedFTs(prev =>
      prev.includes(id)
        ? prev.filter(ftId => ftId !== id)
        : [...prev, id]
    );
  }, []);

  // Filtered FT avec useMemo pour optimiser les performances
  const filteredFT = useMemo(() => {
    return ftList.filter(ft => {
      const matchesFilter = 
        filter === 'all' || 
        ft.status_dossier === filter || 
        (filter === 'deadline_passed' && hasDeadlinePassed(ft));
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        ft.reference_ft.toLowerCase().includes(searchLower) ||
        ft.nom_complet.toLowerCase().includes(searchLower) ||
        ft.commune.toLowerCase().includes(searchLower) ||
        (ft.infraction && ft.infraction.toLowerCase().includes(searchLower));
      
      return matchesFilter && matchesSearch;
    });
  }, [ftList, filter, searchTerm, hasDeadlinePassed]);

  // Select all
  const selectAllFT = useCallback(() => {
    const ftIds = filteredFT.map(ft => ft.id);
    if (selectedFTs.length === ftIds.length) {
      setSelectedFTs([]);
    } else {
      setSelectedFTs(ftIds);
    }
  }, [filteredFT, selectedFTs.length]);

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

  // Grouped by statut de régularisation avec useMemo - AJOUT de la catégorie "Date limite dépassée"
  const { groupedFT, sortedGroups } = useMemo(() => {
    const grouped = filteredFT.reduce((acc, ft) => {
      let statut = getStatutRegularisation(ft);
      
      // Si le FT a une date limite dépassée, le mettre dans la catégorie spéciale
      if (hasDeadlinePassed(ft)) {
        statut = 'Date limite dépassée';
      }
      
      if (!acc[statut]) {
        acc[statut] = [];
      }
      acc[statut].push(ft);
      return acc;
    }, {} as Record<string, FTData[]>);

    const sorted = Object.entries(grouped).sort((a, b) => {
      const order = ['Date limite dépassée', 'Régularisé', 'Irrégularisé'];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    });

    return { groupedFT: grouped, sortedGroups: sorted };
  }, [filteredFT, getStatutRegularisation, hasDeadlinePassed]);

  // Fonctions pour la pagination
  const getPaginatedFT = useCallback((ftList: FTData[], statut: string) => {
    const currentPage = pagination[statut] || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return ftList.slice(startIndex, endIndex);
  }, [pagination]);

  const getTotalPages = useCallback((ftList: FTData[]) => {
    return Math.ceil(ftList.length / ITEMS_PER_PAGE);
  }, []);

  const handlePageChange = useCallback((statut: string, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [statut]: newPage
    }));
  }, []);

  // Loading state pour le tableau principal
  if (isLoading && ftList.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des F.T</h1>
            <p className="text-gray-600 mt-1">Suivi et gestion des F.T. créés</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen p-6 bg-gray-50">
      <ConfirmationModal
        modal={confirmationModal}
        closeModal={closeConfirmationModal}
        executeAction={confirmationModal.action}
      />
      
      {/* Modal de Visualisation */}
      <ViewModal 
        ft={selectedFT} 
        onClose={() => { setSelectedFT(null); setShowModal(false); }} 
        formatters={formatters}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fitanana an-tsoratra</h1>
          <p className="text-gray-600 mt-1">Gestion et suivi des F.T. créés</p>
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
        ) : stats.length > 0 ? (
          stats.map((stat) => (
            <div key={stat.categorie_consolidee} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-gray-600 text-sm font-medium">
                      {stat.categorie_consolidee}
                    </p>
                    {stat.categorie_consolidee !== 'Total F.T.' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.nombre_de_dossiers}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.pourcentage}% du total
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.couleur}`}>
                  {stat.icone}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center py-8">
            <ServerCrash className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucune donnée de F.T. disponible</p>
          </div>
        )}
      </div>

      {/* Filters - AJOUT du filtre "Date limite dépassée" */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence, nom, commune..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FTData['status_dossier'] | 'all' | 'deadline_passed')}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="Traité">Traité</option>
              <option value="Archivé">Archivé</option>
              <option value="Annulé">Annulé</option>
              <option value="deadline_passed">Date limite dépassée</option>
            </select>
          </div>
        </div>
      </div>

      {/* F.T. List Grouped by Statut de Régularisation - AJOUT de la catégorie "Date limite dépassée" */}
      <div className="space-y-4">
        {sortedGroups.map(([statut, statutFT]) => {
          const currentPage = pagination[statut] || 1;
          const totalPages = getTotalPages(statutFT);
          const paginatedFT = getPaginatedFT(statutFT, statut);

          return (
            <div key={statut} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Statut Header */}
              <div 
                className={`flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                  statut === 'Date limite dépassée' ? 'bg-red-50' : 'bg-gray-50'
                }`}
                onClick={() => toggleStatut(statut)}
              >
                <div className="flex items-center space-x-3">
                  {statut === 'Régularisé' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : statut === 'Irrégularisé' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className={`text-lg font-semibold ${
                    statut === 'Date limite dépassée' ? 'text-red-800' : 'text-gray-800'
                  }`}>
                    {statut}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    statut === 'Date limite dépassée' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {statutFT.length} F.T.
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

              {/* Statut F.T. */}
              {expandedStatuts.has(statut) && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={paginatedFT.length > 0 && paginatedFT.every(ft => selectedFTs.includes(ft.id))}
                            onChange={selectAllFT}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Référence</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date/Heure</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Commune</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Types Dossier</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Statut Dossier</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Dossiers Manquants</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date Limite</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedFT.map((ft) => (
                        <tr key={ft.id} className={`hover:bg-gray-50 ${
                          hasDeadlinePassed(ft) ? 'bg-red-50 hover:bg-red-100' : ''
                        }`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedFTs.includes(ft.id)}
                              onChange={() => toggleSelectFT(ft.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${getStatusColorAndIcon(ft.status_dossier).badge}`}>
                                {getStatusColorAndIcon(ft.status_dossier).icon}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {ft.reference_ft}
                                </h4>
                                <p className="text-sm text-gray-600">ID: {ft.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{formatDate(ft.date_ft)}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{formatTime(ft.heure_ft)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{ft.commune}</span>
                            </div>
                            {ft.fokotany && (
                              <p className="text-xs text-gray-500 mt-1">{ft.fokotany}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                              <Home className="w-3 h-3" />
                              {formatDossierTypes(ft.dossier_type)}
                            </span>
                          </td>
                          
                          {/* Colonne Statut Dossier */}
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColorAndIcon(ft.status_dossier).color}`}>
                              {getStatutLabel(ft.status_dossier)}
                            </span>
                          </td>
                          
                          {/* Colonne Dossiers Manquants */}
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="max-w-xs">
                              {hasMissingDossiers(ft) ? (
                                <div className="space-y-3">
                                  {/* Liste des dossiers manquants avec cases à cocher */}
                                  <div className="space-y-2">
                                    {ft.missing_dossiers?.map(dossier => (
                                      <div key={dossier} className="flex items-center text-xs space-x-2">
                                        <input
                                          id={`dossier-${ft.id}-${dossier}`}
                                          type="checkbox"
                                          checked={checkedDossiers[ft.id]?.includes(dossier) || false}
                                          onChange={() => toggleDossierCheck(ft.id, dossier)}
                                          className="rounded text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <label htmlFor={`dossier-${ft.id}-${dossier}`} className="text-gray-700">
                                          {dossier}
                                        </label>
                                      </div>
                                    ))}
                                    {getCheckedCount(ft.id) > 0 && (
                                      <button
                                        onClick={() => handleValidateCheckedDossiers(ft.id)}
                                        disabled={isSubmitting}
                                        className="mt-2 w-full flex items-center justify-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                      >
                                        {isSubmitting ? 'Validation...' : `Valider (${getCheckedCount(ft.id)})`}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Dossier Complet
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* NOUVELLE COLONNE: Date Limite */}
                          <td className="px-4 py-3 text-sm">
                            {ft.deadline_complement ? (
                              <div className={`flex flex-col items-start space-y-1 ${
                                hasDeadlinePassed(ft) ? 'text-red-600 font-semibold' : 'text-orange-600'
                              }`}>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(ft.deadline_complement)}</span>
                                </div>
                                {hasDeadlinePassed(ft) && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    DÉPASSÉE
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Non définie</span>
                            )}
                          </td>
                          
                          {/* Colonne Actions (Visualisation et Suppression seulement) */}
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              {/* Icône de Visualisation */}
                              <button
                                onClick={() => handleViewClick(ft)}
                                className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Voir les détails"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              
                              {/* Icône de Suppression */}
                              <button
                                onClick={() => requestDelete(ft.id, ft.reference_ft)}
                                className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                                title="Supprimer le F.T."
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
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
        
        {ftList.length === 0 && !isLoading && (
          <div className="col-span-4 text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucun F.T. trouvé pour les critères actuels.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FTComponent;
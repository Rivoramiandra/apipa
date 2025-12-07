import React, { useState, useEffect } from 'react';
import {
  DollarSign, Calendar, FileText, CheckCircle, AlertCircle, X,
  Plus, Search, Edit, Trash2, RefreshCw, Eye, ChevronLeft,
  ChevronRight, CreditCard, Receipt, User, ArrowRight
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Interface pour les données de paiement
interface Paiement {
  id: number;
  ap_id: number;
  date_payment: string;
  method_payment: 'Espèces' | 'Chèque' | 'Virement' | 'Carte';
  montant: number;
  reference_payment: string;
  notes: string;
  payment_type: string;
  montant_total: number;
  montant_reste: number;
  nombre_tranches: number;
  montant_tranche: number;
  numero_tranche: number;
  created_at: string;
  updated_at: string;
  contact: string;
  statut: string;
}

// Interface pour les stats
interface Stats {
  total_paiements: number;
  paiements_completes: number;
  paiements_partiels: number;
  total_montant_percu: number;
  total_montant_attendu: number;
  total_montant_reste: number;
  statut: string;
  method_payment: string;
}

// Interface pour la comparaison avant/après paiement
interface PaymentComparison {
  ancienMontantPaye: number;
  nouveauMontantPaye: number;
  ancienMontantReste: number;
  nouveauMontantReste: number;
  ancienNumeroTranche: number;
  nouveauNumeroTranche: number;
  ancienStatut: string;
  nouveauStatut: string;
}

// Composant pour les boutons de méthode de paiement
interface PaymentMethodButtonProps {
  method: {
    value: string;
    label: string;
    icon: JSX.Element;
  };
  isSelected: boolean;
  onChange: (value: 'Espèces' | 'Chèque' | 'Virement' | 'Carte') => void;
  disabled?: boolean;
}

const PaymentMethodButton: React.FC<PaymentMethodButtonProps> = React.memo(({
  method,
  isSelected,
  onChange,
  disabled = false
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(method.value as 'Espèces' | 'Chèque' | 'Virement' | 'Carte');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-green-500 bg-green-100 ring-2 ring-green-200'
          : 'border-green-200 hover:border-green-300 bg-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center space-x-2 w-full">
        <div className={`p-1 rounded ${
          isSelected ? 'text-green-600' : 'text-green-400'
        }`}>
          {method.icon}
        </div>
        <span className="text-sm font-medium">{method.label}</span>
      </div>
    </button>
  );
});

PaymentMethodButton.displayName = 'PaymentMethodButton';

const GestionPaiements: React.FC = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNextPaymentModal, setShowNextPaymentModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [editingPaiement, setEditingPaiement] = useState<Paiement | null>(null);
  const [paiementForNextPayment, setPaiementForNextPayment] = useState<Paiement | null>(null);
  const [paymentComparison, setPaymentComparison] = useState<PaymentComparison | null>(null);
 
  // États pour les formulaires avec gestion améliorée des méthodes de paiement
  const [editFormData, setEditFormData] = useState<Partial<Paiement>>({});
  const [nextPaymentFormData, setNextPaymentFormData] = useState({
    montant: 0,
    date_payment: new Date().toISOString().split('T')[0],
    method_payment: 'Espèces' as 'Espèces' | 'Chèque' | 'Virement' | 'Carte',
    notes: '',
    reference_payment: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  // Configuration de l'API
  const API_BASE_URL = 'http://localhost:3000/api/gestion-paiement';

  // Méthodes de paiement
  const paymentMethods = [
    { value: 'Espèces', label: 'Espèces', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'Chèque', label: 'Chèque', icon: <FileText className="w-4 h-4" /> },
    { value: 'Virement', label: 'Virement', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'Carte', label: 'Carte Bancaire', icon: <CreditCard className="w-4 h-4" /> }
  ];

  // Fonction pour déterminer la couleur du statut
  const getStatutColor = (statut: string): string => {
    switch (statut) {
      case 'Complété':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Partiel':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Fonction pour obtenir l'icône du statut
  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'Complété':
        return <CheckCircle className="w-3 h-3" />;
      case 'Partiel':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Fonction pour obtenir l'icône de la méthode de paiement
  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'espèces':
      case 'especes':
        return <DollarSign className="w-4 h-4" />;
      case 'chèque':
      case 'cheque':
        return <FileText className="w-4 h-4" />;
      case 'virement':
        return <CreditCard className="w-4 h-4" />;
      case 'carte':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  // Charger les données depuis l'API
  useEffect(() => {
    fetchData();
  }, [currentPage, activeTab, searchTerm]);

  // Réinitialiser la comparaison quand le modal se ferme
  useEffect(() => {
    if (!showNextPaymentModal) {
      setPaymentComparison(null);
    }
  }, [showNextPaymentModal]);

  const fetchPaiements = async () => {
    try {
      setError(null);
     
      let url = `${API_BASE_URL}/paiements`;
      const params = new URLSearchParams();
     
      if (searchTerm && searchTerm.trim() !== '') {
        params.append('search', searchTerm.trim());
      }
     
      if (activeTab !== 'all') {
        const statutMap: { [key: string]: string } = {
          'complet': 'Complété',
          'partiel': 'Partiel'
        };
        const statutValue = statutMap[activeTab];
        if (statutValue) {
          params.append('statut', statutValue);
        }
      }
     
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
     
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
     
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Impossible de parser la réponse d\'erreur' };
        }
       
        throw new Error(
          errorData.message ||
          `Erreur ${response.status}: ${response.statusText}`
        );
      }
     
      const result = await response.json();
     
      if (result.success) {
        setPaiements(result.data || []);
        setTotal(result.data?.length || 0);
        setTotalPages(1);
      } else {
        throw new Error(result.message || 'Réponse non réussie du serveur');
      }
     
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Erreur: ${errorMessage}`);
      toast.error(`Erreur lors du chargement: ${errorMessage}`);
    }
  };

  const fetchStats = async () => {
    try {
      const url = `${API_BASE_URL}/stats`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        const statsData = result.data || [];
        const aggregatedStats = {
          total_paiements: statsData.reduce((acc: number, item: any) => acc + parseInt(item.total_paiements || 0), 0),
          paiements_complets: statsData.reduce((acc: number, item: any) => acc + parseInt(item.paiements_completes || 0), 0),
          paiements_partiels: statsData.reduce((acc: number, item: any) => acc + parseInt(item.paiements_partiels || 0), 0),
          total_montant_percu: statsData.reduce((acc: number, item: any) => acc + parseFloat(item.montant_total_percu || 0), 0),
          total_montant_attendu: statsData.reduce((acc: number, item: any) => acc + parseFloat(item.montant_total_attendu || 0), 0),
          total_montant_reste: statsData.reduce((acc: number, item: any) => acc + parseFloat(item.montant_total_reste || 0), 0)
        };
        setStats(aggregatedStats);
      }
    } catch (err) {
      console.error('❌ Erreur lors du fetch des stats:', err);
      toast.error('Erreur lors du chargement des statistiques');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPaiements(), fetchStats()]);
    setLoading(false);
  };

  // Fonction pour recharger les données
  const handleRetry = () => {
    fetchData();
    toast.success('Données rafraîchies');
  };

  // Gestion du paiement suivant avec comparaison avant/après
  const handleNextPaymentClick = (paiement: Paiement) => {
    setPaiementForNextPayment(paiement);
   
    // Calculer le montant suggéré pour la prochaine tranche
    const montantTrancheSuggere = paiement.montant_tranche;
    const montantMax = paiement.montant_reste;
    const montantPaiement = Math.min(montantTrancheSuggere, montantMax);
    
    // CALCUL SELON VOTRE PRINCIPE : montant déjà payé + montant de la tranche
    const nouveauMontantPaye = paiement.montant + montantPaiement;
    
    // CALCUL SELON VOTRE PRINCIPE : reste payé - montant de la tranche
    const nouveauMontantReste = paiement.montant_reste - montantPaiement;
   
    // CALCUL DU NOUVEAU NUMÉRO DE TRANCHE (on coche la tranche suivante)
    const nouveauNumeroTranche = paiement.numero_tranche + 1;
    
    // DÉTERMINER LE NOUVEAU STATUT
    let nouveauStatut = 'Partiel';
    if (nouveauMontantReste === 0) {
      nouveauStatut = 'Complété';
    } else if (nouveauNumeroTranche === paiement.nombre_tranches) {
      nouveauStatut = 'Complété';
    }

    // Préparer les données de comparaison
    setPaymentComparison({
      ancienMontantPaye: paiement.montant,
      nouveauMontantPaye,
      ancienMontantReste: paiement.montant_reste,
      nouveauMontantReste,
      ancienNumeroTranche: paiement.numero_tranche,
      nouveauNumeroTranche,
      ancienStatut: paiement.statut,
      nouveauStatut
    });

    setNextPaymentFormData({
      montant: montantPaiement,
      date_payment: new Date().toISOString().split('T')[0],
      method_payment: paiement.method_payment,
      notes: `Paiement de la tranche ${paiement.numero_tranche + 1}/${paiement.nombre_tranches}`,
      reference_payment: paiement.reference_payment || ''
    });
    setShowNextPaymentModal(true);
  };

  // Mettre à jour la comparaison quand le montant change
  useEffect(() => {
    if (paiementForNextPayment && nextPaymentFormData.montant !== undefined) {
      const montantPaiement = nextPaymentFormData.montant;
      
      // CALCUL SELON VOTRE PRINCIPE
      const nouveauMontantPaye = paiementForNextPayment.montant + montantPaiement;
      const nouveauMontantReste = paiementForNextPayment.montant_reste - montantPaiement;
      const nouveauNumeroTranche = paiementForNextPayment.numero_tranche + 1;
      
      let nouveauStatut = 'Partiel';
      if (nouveauMontantReste === 0) {
        nouveauStatut = 'Complété';
      } else if (nouveauNumeroTranche === paiementForNextPayment.nombre_tranches) {
        nouveauStatut = 'Complété';
      }

      setPaymentComparison({
        ancienMontantPaye: paiementForNextPayment.montant,
        nouveauMontantPaye,
        ancienMontantReste: paiementForNextPayment.montant_reste,
        nouveauMontantReste,
        ancienNumeroTranche: paiementForNextPayment.numero_tranche,
        nouveauNumeroTranche,
        ancienStatut: paiementForNextPayment.statut,
        nouveauStatut
      });
    }
  }, [nextPaymentFormData.montant, paiementForNextPayment]);

  // Gestionnaires pour les méthodes de paiement dans les modals
  const handleNextPaymentMethodChange = (value: 'Espèces' | 'Chèque' | 'Virement' | 'Carte') => {
    setNextPaymentFormData(prev => ({ ...prev, method_payment: value }));
  };

  const handleEditMethodPaymentChange = (value: 'Espèces' | 'Chèque' | 'Virement' | 'Carte') => {
    setEditFormData(prev => ({ ...prev, method_payment: value }));
  };

  const handleNextPaymentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNextPaymentFormData(prev => ({
      ...prev,
      [name]: name === 'montant' ? (value ? parseFloat(value) : 0) : value
    }));
  };

  const handleSaveNextPayment = async () => {
    if (!paiementForNextPayment || !paymentComparison) return;
    
    // Afficher la modal de confirmation
    setShowConfirmationModal(true);
  };

  const confirmSaveNextPayment = async () => {
    if (!paiementForNextPayment || !paymentComparison) return;
    
    try {
      // Validation de la référence pour chèque et virement
      if ((nextPaymentFormData.method_payment === 'Chèque' || nextPaymentFormData.method_payment === 'Virement') &&
          !nextPaymentFormData.reference_payment) {
        toast.error(`La référence est requise pour les paiements par ${nextPaymentFormData.method_payment}`);
        return;
      }

      // Mettre à jour le paiement existant avec les nouvelles valeurs calculées
      const updatedPaiement = {
        ...paiementForNextPayment,
        montant: paymentComparison.nouveauMontantPaye,
        montant_reste: paymentComparison.nouveauMontantReste,
        numero_tranche: paymentComparison.nouveauNumeroTranche,
        statut: paymentComparison.nouveauStatut,
        date_payment: nextPaymentFormData.date_payment,
        method_payment: nextPaymentFormData.method_payment,
        reference_payment: nextPaymentFormData.reference_payment || paiementForNextPayment.reference_payment,
        notes: paiementForNextPayment.notes + (nextPaymentFormData.notes ? `\n\n${nextPaymentFormData.notes}` : ''),
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/paiements/${paiementForNextPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPaiement),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }

      await fetchData();
      setShowNextPaymentModal(false);
      setShowConfirmationModal(false);
      setPaiementForNextPayment(null);
      setPaymentComparison(null);
      
      // Afficher un toast de confirmation avec les détails
      toast.success(
        <div className="space-y-2">
          <div className="font-semibold">✅ Paiement enregistré avec succès !</div>
          <div className="text-sm">
            <div>💰 Montant payé: {formatCurrency(paymentComparison.ancienMontantPaye)} → {formatCurrency(paymentComparison.nouveauMontantPaye)}</div>
            <div>📊 Reste à payer: {formatCurrency(paymentComparison.ancienMontantReste)} → {formatCurrency(paymentComparison.nouveauMontantReste)}</div>
            <div>🎯 Statut: {paymentComparison.ancienStatut} → {paymentComparison.nouveauStatut}</div>
          </div>
        </div>,
        { duration: 5000 }
      );
     
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du paiement:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du paiement.');
    }
  };

  // Fonctions utilitaires
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';
  };

  const handleViewClick = (paiement: Paiement) => {
    setSelectedPaiement(paiement);
    setShowModal(true);
  };

  // Filtrer les paiements par statut
  const paiementsComplets = paiements.filter(p => p.statut === 'Complété');
  const paiementsPartiels = paiements.filter(p => p.statut === 'Partiel');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  // Composant de tableau réutilisable
  const PaiementsTable = ({ paiements, titre, statut }: { paiements: Paiement[], titre: string, statut: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {getStatutIcon(statut)}
          {titre} <span className="text-gray-500 text-sm font-normal">({paiements.length})</span>
        </h3>
      </div>
     
      {paiements.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Référence</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Méthode</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Montant</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Reste</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Tranche</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Statut</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Opérations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paiements.map((paiement) => (
                  <tr key={paiement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(paiement.method_payment)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {paiement.reference_payment || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            AP #{paiement.ap_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {paiement.contact || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {paiement.method_payment || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(paiement.montant)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(paiement.montant_reste)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(paiement.date_payment)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {paiement.numero_tranche}/{paiement.nombre_tranches}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatutColor(paiement.statut)}`}>
                        {getStatutIcon(paiement.statut)}
                        <span className="ml-1">{paiement.statut}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => handleViewClick(paiement)}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                       
                        {/* Bouton compléter le paiement - seulement pour les paiements partiels */}
                        {statut === 'Partiel' && paiement.montant_reste > 0 && (
                          <button
                            className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                            title="Compléter le paiement"
                            onClick={() => handleNextPaymentClick(paiement)}
                          >
                            Compléter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          Aucun paiement {titre.toLowerCase()} trouvé.
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen p-6 bg-gray-50">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 5000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
          <p className="text-gray-600 mt-1">Suivi et gestion des transactions financières</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total paiements</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_paiements ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">transactions</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
       
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Montant perçu</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats?.total_montant_percu ?? 0)}</p>
              <p className="text-xs text-gray-500 mt-1">total encaissé</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Receipt className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
       
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Paiements complets</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats?.paiements_complets ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">soldés</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Paiements partiels</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.paiements_partiels ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">en cours</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-500">
              <AlertCircle className="w-8 h-8 text-white" />
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
                placeholder="Rechercher par référence, contact, méthode, statut..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
         
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'complet', label: 'Complets' },
              { key: 'partiel', label: 'Partiels' }
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

      {/* Tableaux séparés par statut */}
      {activeTab === 'all' || activeTab === 'complet' ? (
        <PaiementsTable
          paiements={paiementsComplets}
          titre="Paiements Complets"
          statut="Complété"
        />
      ) : null}
      {activeTab === 'all' || activeTab === 'partiel' ? (
        <PaiementsTable
          paiements={paiementsPartiels}
          titre="Paiements Partiels"
          statut="Partiel"
        />
      ) : null}

      {/* Modal de visualisation */}
      {showModal && selectedPaiement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails du paiement</h3>
                <p className="text-gray-600 mt-1">Informations détaillées sur la transaction</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Informations principales */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    Informations de base
                  </h4>
                 
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Référence:</span>
                      <span className="text-gray-900 font-mono">{selectedPaiement.reference_payment || 'Non spécifié'}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">ID AP:</span>
                      <span className="text-gray-900">#{selectedPaiement.ap_id}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Méthode:</span>
                      <span className="text-gray-900">{selectedPaiement.method_payment || 'Non spécifié'}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="text-gray-900">{selectedPaiement.payment_type || 'Non spécifié'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Statut:</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatutColor(selectedPaiement.statut)}`}>
                        {getStatutIcon(selectedPaiement.statut)}
                        <span className="ml-1">{selectedPaiement.statut}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {/* Montants */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Informations financières
                  </h4>
                 
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Montant payé:</span>
                      <span className="text-green-600 font-bold">{formatCurrency(selectedPaiement.montant)}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Montant total:</span>
                      <span className="text-gray-900">{formatCurrency(selectedPaiement.montant_total)}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Reste à payer:</span>
                      <span className={`font-bold ${selectedPaiement.montant_reste === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {formatCurrency(selectedPaiement.montant_reste)}
                      </span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Montant tranche:</span>
                      <span className="text-gray-900">{formatCurrency(selectedPaiement.montant_tranche)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Informations de tranche */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Plan de paiement
                  </h4>
                 
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Nombre de tranches:</span>
                      <span className="text-gray-900">{selectedPaiement.nombre_tranches || 1}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Numéro de tranche:</span>
                      <span className="text-gray-900">{selectedPaiement.numero_tranche || 1}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Date paiement:</span>
                      <span className="text-gray-900">{formatDate(selectedPaiement.date_payment)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-600" />
                    Contact & Dates
                  </h4>
                 
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Contact:</span>
                      <span className="text-gray-900">{selectedPaiement.contact || 'Non spécifié'}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Créé le:</span>
                      <span className="text-gray-900">{formatDate(selectedPaiement.created_at)}</span>
                    </div>
                   
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Modifié le:</span>
                      <span className="text-gray-900">{formatDate(selectedPaiement.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Notes */}
              {selectedPaiement.notes && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Notes
                  </h4>
                  <p className="text-gray-700">{selectedPaiement.notes}</p>
                </div>
              )}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
                {/* Bouton pour compléter le paiement - seulement pour les paiements partiels */}
                {selectedPaiement.statut === 'Partiel' && selectedPaiement.montant_reste > 0 && (
                  <button
                    onClick={() => handleNextPaymentClick(selectedPaiement)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Compléter le paiement</span>
                  </button>
                )}
               
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

      {/* Modal de complétion du paiement avec comparaison avant/après */}
      {showNextPaymentModal && paiementForNextPayment && paymentComparison && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Compléter le paiement</h3>
                <p className="text-gray-600 mt-1">Paiement de la tranche {paiementForNextPayment.numero_tranche + 1}/{paiementForNextPayment.nombre_tranches}</p>
              </div>
              <button
                onClick={() => setShowNextPaymentModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne de gauche - Informations actuelles */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-blue-800 mb-3">
                      <Receipt className="w-5 h-5" />
                      <span className="font-medium">Informations actuelles</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Montant payé:</span>
                        <span className="font-bold">{formatCurrency(paymentComparison.ancienMontantPaye)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Reste à payer:</span>
                        <span className="font-bold">{formatCurrency(paymentComparison.ancienMontantReste)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Tranche actuelle:</span>
                        <span className="font-bold">{paymentComparison.ancienNumeroTranche}/{paiementForNextPayment.nombre_tranches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Statut:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatutColor(paymentComparison.ancienStatut)}`}>
                          {paymentComparison.ancienStatut}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colonne du centre - Comparaison avant/après */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-gray-800 mb-4">
                      <ArrowRight className="w-5 h-5" />
                      <span className="font-medium">Comparaison avant/après paiement</span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Montant payé */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Montant payé:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-600">{formatCurrency(paymentComparison.ancienMontantPaye)}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-green-600">{formatCurrency(paymentComparison.nouveauMontantPaye)}</span>
                        </div>
                      </div>
                      
                      {/* Reste à payer */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Reste à payer:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-600">{formatCurrency(paymentComparison.ancienMontantReste)}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-green-600">{formatCurrency(paymentComparison.nouveauMontantReste)}</span>
                        </div>
                      </div>
                      
                      {/* Numéro de tranche */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tranche:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-600">{paymentComparison.ancienNumeroTranche}/{paiementForNextPayment.nombre_tranches}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-green-600">{paymentComparison.nouveauNumeroTranche}/{paiementForNextPayment.nombre_tranches}</span>
                        </div>
                      </div>
                      
                      {/* Statut */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Statut:</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${getStatutColor(paymentComparison.ancienStatut)}`}>
                            {paymentComparison.ancienStatut}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className={`text-xs px-2 py-1 rounded ${getStatutColor(paymentComparison.nouveauStatut)}`}>
                            {paymentComparison.nouveauStatut}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colonne de droite - Formulaire */}
                <div className="space-y-4">
                  {/* Méthode de paiement avec les boutons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Méthode de paiement *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <PaymentMethodButton
                          key={method.value}
                          method={method}
                          isSelected={nextPaymentFormData.method_payment === method.value}
                          onChange={handleNextPaymentMethodChange}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Référence conditionnelle */}
                  {(nextPaymentFormData.method_payment === 'Chèque' || nextPaymentFormData.method_payment === 'Virement') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {nextPaymentFormData.method_payment === 'Chèque' ? 'Numéro de chèque *' : 'Référence de virement *'}
                      </label>
                      <input
                        type="text"
                        name="reference_payment"
                        value={nextPaymentFormData.reference_payment}
                        onChange={handleNextPaymentInputChange}
                        placeholder={
                          nextPaymentFormData.method_payment === 'Chèque'
                            ? 'Entrez le numéro du chèque'
                            : 'Entrez la référence du virement'
                        }
                        maxLength={255}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                  {/* Montant et Date sur la même ligne */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant de la tranche {paiementForNextPayment.numero_tranche + 1} *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="montant"
                        value={nextPaymentFormData.montant}
                        onChange={handleNextPaymentInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        max={paiementForNextPayment.montant_reste}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Montant suggéré: {formatCurrency(paiementForNextPayment.montant_tranche)}<br />
                        Maximum: {formatCurrency(paiementForNextPayment.montant_reste)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date du paiement
                      </label>
                      <input
                        type="date"
                        name="date_payment"
                        value={nextPaymentFormData.date_payment}
                        onChange={handleNextPaymentInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optionnel)
                    </label>
                    <textarea
                      name="notes"
                      value={nextPaymentFormData.notes}
                      onChange={handleNextPaymentInputChange}
                      rows={3}
                      placeholder={`Paiement de la tranche ${paiementForNextPayment.numero_tranche + 1}/${paiementForNextPayment.nombre_tranches}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                </div>
              </div>
              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowNextPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNextPayment}
                  disabled={nextPaymentFormData.montant <= 0 ||
                           nextPaymentFormData.montant > paiementForNextPayment.montant_reste ||
                           ((nextPaymentFormData.method_payment === 'Chèque' || nextPaymentFormData.method_payment === 'Virement') &&
                            !nextPaymentFormData.reference_payment)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Enregistrer le paiement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[3000] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Confirmer l'enregistrement
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir enregistrer ce paiement ? Cette action mettra à jour le statut du paiement.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmSaveNextPayment}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPaiements;
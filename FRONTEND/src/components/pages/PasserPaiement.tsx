import React, { useState, useMemo, useCallback } from 'react';
import { DollarSign, X, Calendar, CreditCard, FileText, CheckCircle, Clock, MapPin, Divide, AlertCircle } from 'lucide-react';
import { APData } from './ListeAP';

interface PaymentModalProps {
  ap: APData;
  onClose: () => void;
  onSuccess?: () => void;
  loading?: boolean;
}

// Interface mise à jour avec le contact
export interface PaymentDetails {
  ap_id: number;
  date_payment: string;
  method_payment: 'especes' | 'cheque' | 'virement' | 'carte';
  montant: number;
  reference_payment?: string;
  notes?: string;
  payment_type: 'complet' | 'tranche';
  montant_total: number;
  montant_reste: number;
  nombre_tranches?: number;
  montant_tranche?: number;
  numero_tranche?: number;
  contact?: string;
}

// Interface pour la mise à jour du statut
interface StatutUpdateData {
  statut: string;
  date_mise_a_jour?: string;
  last_payment_date?: string;
}

interface PaymentMethodButtonProps {
  method: {
    value: string;
    label: string;
    icon: JSX.Element;
  };
  isSelected: boolean;
  onChange: (value: 'especes' | 'cheque' | 'virement' | 'carte') => void;
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
      onChange(method.value as 'especes' | 'cheque' | 'virement' | 'carte');
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

// Fonction utilitaire pour formater les montants
const formatMontant = (montant: any): number => {
  if (typeof montant === 'number') {
    return parseFloat(montant.toFixed(2));
  }
  if (typeof montant === 'string') {
    // Nettoyer la chaîne (virgules, espaces, etc.)
    const cleaned = montant.replace(',', '.').replace(/\s/g, '');
    return parseFloat(parseFloat(cleaned || '0').toFixed(2));
  }
  return 0;
};

const PasserPaiement: React.FC<PaymentModalProps> = ({ 
  ap, 
  onClose, 
  onSuccess,
  loading = false 
}) => {
  const [paymentType, setPaymentType] = useState<'complet' | 'tranche'>('complet');
  const [nombreTranches, setNombreTranches] = useState<number>(1);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<PaymentDetails, 'ap_id' | 'montant_total' | 'montant_reste' | 'numero_tranche'>>({
    date_payment: new Date().toISOString().split('T')[0],
    method_payment: 'especes',
    montant: ap.montant_chiffre || 0,
    reference_payment: '',
    notes: '',
    payment_type: 'complet',
    nombre_tranches: 1,
    montant_tranche: ap.montant_chiffre || 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculs pour le paiement en tranches
  const paymentCalculations = useMemo(() => {
    const montantTotal = ap.montant_chiffre || 0;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const moisRestants = 12 - currentMonth;
    const maxTranches = Math.min(5, moisRestants);
    const montantParTranche = montantTotal / nombreTranches;
    const montantRestant = paymentType === 'tranche' ? montantTotal - (formData.montant || 0) : 0;

    return {
      montantTotal,
      moisRestants,
      maxTranches,
      montantParTranche,
      montantRestant,
      currentYear
    };
  }, [ap.montant_chiffre, nombreTranches, paymentType, formData.montant]);

  // Gestionnaires d'événements optimisés
  const handlePaymentTypeChange = useCallback((value: 'complet' | 'tranche') => {
    setPaymentType(value);
    const newMontant = value === 'complet' ? (ap.montant_chiffre || 0) : paymentCalculations.montantParTranche;
    
    setFormData(prev => ({ 
      ...prev, 
      payment_type: value,
      montant: newMontant,
      montant_tranche: value === 'tranche' ? paymentCalculations.montantParTranche : undefined
    }));
    setApiError(null);
  }, [ap.montant_chiffre, paymentCalculations.montantParTranche]);

  const handleTranchesChange = useCallback((value: number) => {
    const nbTranches = Math.max(1, Math.min(value, paymentCalculations.maxTranches));
    setNombreTranches(nbTranches);
    const newMontant = paymentCalculations.montantTotal / nbTranches;
    
    setFormData(prev => ({ 
      ...prev, 
      nombre_tranches: nbTranches,
      montant: newMontant,
      montant_tranche: newMontant
    }));
    setApiError(null);
  }, [paymentCalculations.maxTranches, paymentCalculations.montantTotal]);

  const handleMethodPaymentChange = useCallback((value: 'especes' | 'cheque' | 'virement' | 'carte') => {
    setFormData(prev => ({ ...prev, method_payment: value }));
    setApiError(null);
  }, []);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'payment_type') {
      handlePaymentTypeChange(value as 'complet' | 'tranche');
    } else if (name === 'nombre_tranches') {
      handleTranchesChange(parseInt(value) || 1);
    } else if (name === 'method_payment') {
      handleMethodPaymentChange(value as 'especes' | 'cheque' | 'virement' | 'carte');
    } else if (name === 'montant') {
      // CORRECTION : Conversion sécurisée en nombre
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError(null);
  }, [errors, handlePaymentTypeChange, handleTranchesChange, handleMethodPaymentChange]);

  // Validation améliorée avec correction de la date
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation date
    if (!formData.date_payment) {
      newErrors.date_payment = 'La date de paiement est requise';
    } else {
      const selectedDate = new Date(formData.date_payment);
      const today = new Date();
      
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        newErrors.date_payment = 'La date de paiement ne peut pas être dans le futur';
      }
    }

    // Validation montant
    if (!formData.montant || formData.montant <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    } else if (formData.montant > paymentCalculations.montantTotal) {
      newErrors.montant = `Le montant ne peut pas dépasser ${formatCurrency(paymentCalculations.montantTotal)}`;
    } else if (paymentType === 'complet' && Math.abs(formData.montant - paymentCalculations.montantTotal) > 0.01) {
      newErrors.montant = `Le montant doit être exactement ${formatCurrency(paymentCalculations.montantTotal)} pour un paiement complet`;
    }

    // Validation tranches
    if (paymentType === 'tranche') {
      if (nombreTranches < 1 || nombreTranches > paymentCalculations.maxTranches) {
        newErrors.nombre_tranches = `Le nombre de tranches doit être entre 1 et ${paymentCalculations.maxTranches}`;
      }
      
      const montantAttendu = paymentCalculations.montantParTranche;
      const montantSaisi = formData.montant;
      
      if (Math.abs(montantSaisi - montantAttendu) > 0.01) {
        newErrors.montant = `Le montant de cette tranche doit être ${formatCurrency(montantAttendu)}`;
      }
    }

    // Validation méthodes de paiement
    if (formData.method_payment === 'cheque' && !formData.reference_payment) {
      newErrors.reference_payment = 'Le numéro de chèque est requis pour les paiements par chèque';
    } else if (formData.method_payment === 'virement' && !formData.reference_payment) {
      newErrors.reference_payment = 'La référence de virement est requise pour les virements';
    }

    // Validation format référence si fournie
    if (formData.reference_payment && formData.reference_payment.length > 255) {
      newErrors.reference_payment = 'La référence ne peut pas dépasser 255 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion d'erreur API améliorée
  const handleApiError = (error: any) => {
    console.error('❌ Erreur API détaillée:', error);
    
    if (error.code === '23503') {
      return 'Erreur de référence : L\'AP spécifié n\'existe pas';
    } else if (error.code === '23505') {
      return 'Erreur de duplication : Ce paiement existe déjà';
    } else if (error.code === '23514') {
      return 'Erreur de validation : Les données ne respectent pas les contraintes';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'Erreur de connexion : Impossible de joindre le serveur';
    } else if (error.status === 400) {
      return `Erreur de validation : ${error.message || 'Données invalides'}`;
    } else if (error.status === 404) {
      return 'Erreur : Ressource non trouvée';
    } else if (error.status === 500) {
      return 'Erreur serveur : Veuillez réessayer plus tard';
    }
    
    return error.message || 'Une erreur inattendue est survenue';
  };

  // Fonction pour mettre à jour le statut de l'AP
  const updateAPStatus = async (apId: number, paymentType: 'complet' | 'tranche'): Promise<any> => {
    try {
      console.log('🔄 Mise à jour du statut de l\'AP:', apId);
      
      // Déterminer le nouveau statut selon le type de paiement
      let nouveauStatut: string;
      
      if (paymentType === 'complet') {
        nouveauStatut = 'payé'; // Statut final pour paiement complet
      } else {
        nouveauStatut = 'paiement en cours'; // Statut intermédiaire pour paiement en tranches
      }

      const updateAPResponse = await fetch(`http://localhost:3000/api/${apId}/statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statut: nouveauStatut,
          date_mise_a_jour: new Date().toISOString(),
          last_payment_date: new Date().toISOString().split('T')[0]
        }),
      });

      if (!updateAPResponse.ok) {
        const errorText = await updateAPResponse.text();
        throw new Error(`Erreur HTTP ${updateAPResponse.status}: ${errorText}`);
      }

      const updateData = await updateAPResponse.json();
      console.log('✅ Statut AP mis à jour:', updateData);
      
      return updateData;

    } catch (updateError) {
      console.error('❌ Erreur lors de la mise à jour du statut AP:', updateError);
      throw new Error(`Paiement enregistré mais échec de la mise à jour du statut: ${updateError.message}`);
    }
  };

  // Fonction pour afficher le message de succès
  const showSuccessMessage = (paymentId: number, montant: number, paymentType: 'complet' | 'tranche') => {
    const message = paymentType === 'complet' 
      ? `✅ Paiement complet enregistré !\n• ID: ${paymentId}\n• Montant: ${formatCurrency(montant)}\n• Statut: Payé`
      : `✅ Première tranche enregistrée !\n• ID: ${paymentId}\n• Montant: ${formatCurrency(montant)}\n• Statut: Paiement en cours\n• Prochaine échéance: ${getNextPaymentDate()}`;

    alert(message);
  };

  // Fonction utilitaire pour calculer la prochaine date de paiement
  const getNextPaymentDate = (): string => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return formatDate(nextMonth.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);

    try {
      // CORRECTION : Utilisation de la fonction formatMontant pour garantir que c'est un nombre
      const montantFormate = formatMontant(formData.montant);

      // Préparer les données pour l'API avec le contact
      const paymentData: PaymentDetails = {
        ap_id: ap.id,
        date_payment: formData.date_payment,
        method_payment: formData.method_payment,
        montant: montantFormate, // CORRIGÉ : Utilisation de la valeur formatée
        reference_payment: formData.reference_payment?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        payment_type: paymentType,
        montant_total: paymentCalculations.montantTotal,
        montant_reste: parseFloat(paymentCalculations.montantRestant.toFixed(2)),
        nombre_tranches: paymentType === 'tranche' ? nombreTranches : undefined,
        montant_tranche: paymentType === 'tranche' ? parseFloat(paymentCalculations.montantParTranche.toFixed(2)) : undefined,
        numero_tranche: paymentType === 'tranche' ? 1 : undefined,
        contact: ap.contact || undefined
      };

      console.log('🚀 Envoi du paiement:', paymentData);

      // Étape 1: Enregistrer le paiement
      const response = await fetch('http://localhost:3000/api/paiements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorWithStatus = {
          ...responseData,
          status: response.status,
          statusText: response.statusText
        };
        throw errorWithStatus;
      }

      console.log('✅ Paiement enregistré avec succès:', responseData);

      // Étape 2: Mettre à jour le statut de l'AP dans la table avisdepaiement
      await updateAPStatus(ap.id, paymentType);

      // Afficher message de succès
      showSuccessMessage(responseData.data.id, montantFormate, paymentType);

      // Appeler le callback de succès
      if (onSuccess) {
        onSuccess();
      }

      // Fermer le modal
      onClose();

    } catch (error: any) {
      console.error('❌ Erreur détaillée lors de l\'enregistrement:', error);
      const errorMessage = handleApiError(error);
      setApiError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (!amount || isNaN(amount)) return '0 Ar';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Ar';
  };

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

  const paymentMethods = useMemo(() => [
    { value: 'especes', label: 'Espèces', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'cheque', label: 'Chèque', icon: <FileText className="w-4 h-4" /> },
    { value: 'virement', label: 'Virement', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'carte', label: 'Carte Bancaire', icon: <CreditCard className="w-4 h-4" /> }
  ], []);

  const isProcessing = loading || submitLoading;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-hidden">
  <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
    {/* Header */}
    <div className="p-6 border-b border-gray-200 bg-white flex-shrink-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Enregistrement du Paiement</h3>
            <p className="text-gray-600 mt-1">
              AP: {ap.num_ap} • Référence: {ap.reference_ft}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          disabled={isProcessing}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Banner d'erreur API */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Erreur lors de l'enregistrement</h4>
                <p className="text-sm text-red-700 mt-1">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations AP détaillées */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            Informations de l'Avis de Paiement 
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 font-medium">ID AP:</span>
                <p className="text-gray-800 font-semibold">{ap.id}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Numéro AP:</span>
                <p className="text-gray-800 font-semibold">{ap.num_ap || 'Non attribué'}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Date AP:</span>
                <p className="text-gray-800">{formatDate(ap.date_ap)}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Montant total:</span>
                <p className="text-gray-800 font-bold text-lg">
                  {formatCurrency(paymentCalculations.montantTotal)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 font-medium">Référence FT:</span>
                <p className="text-gray-800">{ap.reference_ft}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Date limite de paiement:</span>
                <p className="text-gray-800 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {ap.date_delai_payment ? formatDate(ap.date_delai_payment) : 'Non spécifiée'}
                </p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Contact:</span>
                <p className="text-gray-800">{ap.contact || 'Non spécifié'}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Montant en lettres:</span>
                <p className="text-gray-800 italic">{ap.montant_lettre || 'Non spécifié'}</p>
              </div>
            </div>
          </div>
          
          {/* Informations supplémentaires */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Infraction:</span>
                <p className="text-gray-800">{ap.infraction || 'Non spécifiée'}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Localité:</span>
                <p className="text-gray-800 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  {ap.localite || 'Non spécifiée'}
                </p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Superficie:</span>
                <p className="text-gray-800">
                  {ap.superficie ? new Intl.NumberFormat('fr-FR').format(ap.superficie) + ' m²' : 'Non spécifiée'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Type de Paiement */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Divide className="w-4 h-4 text-gray-600" />
            Type de Paiement
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => handlePaymentTypeChange('complet')}
              disabled={isProcessing}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all text-left ${
                paymentType === 'complet'
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`p-2 rounded-full ${
                  paymentType === 'complet' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Paiement complet</p>
                  <p className="text-sm text-gray-600">Règlement du montant total en une fois</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentTypeChange('tranche')}
              disabled={isProcessing}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all text-left ${
                paymentType === 'tranche'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`p-2 rounded-full ${
                  paymentType === 'tranche' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Divide className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Paiement en tranches</p>
                  <p className="text-sm text-gray-600">Échelonnement sur plusieurs mois</p>
                </div>
              </div>
            </button>
          </div>

          {/* Configuration des tranches */}
          {paymentType === 'tranche' && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de tranches *
                  </label>
                  <select
                    name="nombre_tranches"
                    value={nombreTranches}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nombre_tranches ? 'border-red-300' : 'border-gray-300'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {Array.from({ length: paymentCalculations.maxTranches }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>
                        {num} tranche{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.nombre_tranches && (
                    <p className="text-red-600 text-sm mt-1">{errors.nombre_tranches}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {paymentCalculations.maxTranches} tranches (mois restants: {paymentCalculations.moisRestants})
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">Récapitulatif</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-700">
                    <p>• Montant par tranche: <strong>{formatCurrency(paymentCalculations.montantParTranche)}</strong></p>
                    <p>• Échéance: avant fin {paymentCalculations.currentYear}</p>
                    <p>• Tranches restantes: {nombreTranches - 1}</p>
                    <p>• Montant total: {formatCurrency(paymentCalculations.montantTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Détails du Paiement */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-600" />
            Détails du Paiement
          </h4>

          {/* Date de paiement */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              Date du paiement *
            </label>
            <input
              type="date"
              name="date_payment"
              value={formData.date_payment}
              onChange={handleInputChange}
              disabled={isProcessing}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date_payment ? 'border-red-300' : 'border-gray-300'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              required
            />
            {errors.date_payment && (
              <p className="text-red-600 text-sm mt-1">{errors.date_payment}</p>
            )}
          </div>

          {/* Méthode de paiement */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Méthode de paiement *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <PaymentMethodButton
                  key={method.value}
                  method={method}
                  isSelected={formData.method_payment === method.value}
                  onChange={handleMethodPaymentChange}
                  disabled={isProcessing}
                />
              ))}
            </div>
          </div>

          {/* Référence (conditionnelle) */}
          {(formData.method_payment === 'cheque' || formData.method_payment === 'virement') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.method_payment === 'cheque' ? 'Numéro de chèque *' : 'Référence de virement *'}
              </label>
              <input
                type="text"
                name="reference_payment"
                value={formData.reference_payment}
                onChange={handleInputChange}
                disabled={isProcessing}
                placeholder={
                  formData.method_payment === 'cheque' 
                    ? 'Entrez le numéro du chèque' 
                    : 'Entrez la référence du virement'
                }
                maxLength={255}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reference_payment ? 'border-red-300' : 'border-gray-300'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.reference_payment && (
                <p className="text-red-600 text-sm mt-1">{errors.reference_payment}</p>
              )}
            </div>
          )}

          {/* Montant */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant à payer {paymentType === 'tranche' ? '(cette tranche)' : ''} *
            </label>
            <div className="relative">
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleInputChange}
                disabled={isProcessing || paymentType === 'tranche'}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={paymentCalculations.montantTotal}
                className={`w-full px-3 py-2 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.montant ? 'border-red-300' : 'border-gray-300'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                required
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            {errors.montant && (
              <p className="text-red-600 text-sm mt-1">{errors.montant}</p>
            )}
            {formData.montant > 0 && !errors.montant && (
              <div className="space-y-1 mt-2">
                <p className="text-gray-700 text-sm font-medium">
                  Montant saisi: {formatCurrency(formData.montant)}
                </p>
                {paymentType === 'tranche' && (
                  <p className="text-blue-600 text-sm">
                    Montant restant: {formatCurrency(paymentCalculations.montantRestant)}
                  </p>
                )}
              </div>
            )}
            {paymentType === 'complet' && (
              <p className="text-blue-600 text-sm mt-1">
                Montant total AP: {formatCurrency(paymentCalculations.montantTotal)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              disabled={isProcessing}
              placeholder="Ajoutez des notes supplémentaires sur ce paiement..."
              rows={3}
              maxLength={1000}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.notes?.length || 0}/1000 caractères
            </p>
          </div>
        </div>
      </form>
    </div>

    {/* Footer */}
    <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
      <button 
        type="button"
        onClick={onClose}
        disabled={isProcessing}
        className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Annuler
      </button>
      
      <button 
        type="submit"
        onClick={handleSubmit}
        disabled={isProcessing}
        className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Enregistrement...</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>
              {paymentType === 'complet' ? 'Confirmer le paiement complet' : `Confirmer la tranche 1/${nombreTranches}`}
            </span>
          </>
        )}
      </button>
    </div>
  </div>
</div>
  );
};

export default PasserPaiement;
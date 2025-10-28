import React, { useState, useEffect } from 'react';
import { FileCheck, X, Download, Upload, User, MapPin, Phone, Home, AlertCircle } from 'lucide-react';

// Interfaces
export interface FTData {
  id: number;
  reference_ft: string;
  date_ft: string;
  nom_complet: string;
  cin: string;
  contact: string;
  adresse: string;
  titre_terrain?: string;
  nomproprietaire?: string;
  superficie?: number;
  motif?: string;
  commune: string;
  fokotany?: string;
  localite?: string;
  coord_x?: number;
  coord_y?: number;
  infraction?: string;
  dossier?: string;
  id_descente?: string;
}

export interface PaymentData {
  id: number;
  ft_id: number;
  reference_payment: string;
  date_payment: string;
  montant: number;
  method_payment: 'especes' | 'cheque' | 'virement' | 'carte';
  motif: string;
  delai_payment?: string;
  statut: 'en_attente' | 'paye' | 'partiel' | 'annule';
  
  // Champs pour l'avis de paiement
  numero_avis?: string;
  date_descente?: string;
  date_faire_ap?: string;
  num_descente?: string;
  num_ft?: string;
  localite?: string;
  zone_type?: 'CUA' | 'peripherie';
  coord_x?: number;
  coord_y?: number;
  superficie_terrain?: number;
  nomproprietaire?: string;
  
  // Tableau de calcul
  titre_foncier?: string;
  destination_terrain?: string;
  valeur_unitaire?: number;
  montant_total?: number;
  montant_lettres?: string;
  
  // Informations du contrevenant
  nom_contrevenant?: string;
  cin_contrevenant?: string;
  contact_contrevenant?: string;
  adresse_contrevenant?: string;
}

// Interfaces pour les algorithmes de calcul
export interface CalculResult {
  redevance: number;
  amende: number;
  calcul_redevance: boolean;
}

// Algorithmes de calcul des taxes et amendes
export const calculerTaxesComplet = (
  zone_type: 'constructible' | 'inconstructible',
  type_attraction: 'H' | 'I' | 'C',
  superficie: number,
  zone_geographique: 'CUA' | 'peripherie'
): CalculResult => {
  const resultats: CalculResult = {
    redevance: 0,
    amende: 0,
    calcul_redevance: false
  };

  if (zone_type === 'constructible') {
    resultats.calcul_redevance = true;
    
    if (zone_geographique === 'CUA') {
      if (superficie < 100) {
        resultats.redevance = type_attraction === 'H' ? 6250 : 12500;
        resultats.amende = type_attraction === 'H' ? 12500 : 25000;
      } else if (superficie === 100) {
        resultats.redevance = type_attraction === 'H' ? 12500 : 18750;
        resultats.amende = type_attraction === 'H' ? 25000 : 37500;
      } else if (superficie < 2000) {
        if (type_attraction === 'H') {
          resultats.redevance = 12500;
          resultats.amende = 25000;
        } else {
          resultats.redevance = 18750;
          resultats.amende = 37500;
        }
      } else {
        resultats.redevance = type_attraction === 'H' ? 12500 : 25000;
        resultats.amende = type_attraction === 'H' ? 25000 : 50000;
      }
    } else {
      if (superficie < 100) {
        resultats.redevance = type_attraction === 'H' ? 3125 : 6250;
        resultats.amende = type_attraction === 'H' ? 6250 : 12500;
      } else if (superficie === 100) {
        resultats.redevance = type_attraction === 'H' ? 6250 : 9375;
        resultats.amende = type_attraction === 'H' ? 12500 : 18750;
      } else if (superficie < 2000) {
        if (type_attraction === 'H') {
          resultats.redevance = 6250;
          resultats.amende = 12500;
        } else {
          resultats.redevance = 9375;
          resultats.amende = 18750;
        }
      } else {
        resultats.redevance = type_attraction === 'H' ? 6250 : 12500;
        resultats.amende = type_attraction === 'H' ? 12500 : 25000;
      }
    }
  } else if (zone_type === 'inconstructible') {
    resultats.calcul_redevance = false;
    resultats.redevance = 0;
    
    if (zone_geographique === 'CUA') {
      if (superficie < 100) {
        resultats.amende = type_attraction === 'H' ? 12500 : 25000;
      } else if (superficie === 100) {
        resultats.amende = type_attraction === 'H' ? 25000 : 37500;
      } else if (superficie < 2000) {
        resultats.amende = type_attraction === 'H' ? 25000 : 37500;
      } else {
        resultats.amende = type_attraction === 'H' ? 25000 : 50000;
      }
    } else {
      if (superficie < 100) {
        resultats.amende = type_attraction === 'H' ? 6250 : 12500;
      } else if (superficie === 100) {
        resultats.amende = type_attraction === 'H' ? 12500 : 18750;
      } else if (superficie < 2000) {
        resultats.amende = type_attraction === 'H' ? 12500 : 18750;
      } else {
        resultats.amende = type_attraction === 'H' ? 12500 : 25000;
      }
    }
  }

  return resultats;
};

// Fonctions utilitaires
export const mapDestinationToAttraction = (destination: string): 'H' | 'I' | 'C' => {
  switch (destination) {
    case 'HABITATION':
      return 'H';
    case 'INDUSTRIEL':
      return 'I';
    case 'COMMERCIAL':
      return 'C';
    default:
      return 'H';
  }
};

export const getTypePaiementSelonZone = (zone_type: 'constructible' | 'inconstructible'): 'amende' | 'redevance' | 'total' => {
  return zone_type === 'inconstructible' ? 'amende' : 'total';
};

// Composant principal
const FaireAPComponent: React.FC<{
  ft: FTData;
  onClose: () => void;
  onUpdate: (paymentData: Partial<PaymentData>) => void; // ✅ Changé de onCreate à onUpdate
}> = ({ ft, onClose, onUpdate }) => { // ✅ Changé de onCreate à onUpdate
  const [formData, setFormData] = useState({
    type_payment: 'total' as 'amende' | 'taxe' | 'redevance' | 'autre' | 'total',
    motif: '',
    delai_payment: '15' as '8' | '15',
    
    // Champs pour l'avis de paiement
    numero_avis: '',
    date_descente: '',
    date_faire_ap: '',
    num_descente: '',
    num_ft: '',
    localite: '',
    zone_type: 'CUA' as 'CUA' | 'peripherie',
    coord_x: '',
    coord_y: '',
    superficie_terrain: '',
    nomproprietaire: '',
    
    // Tableau de calcul
    titre_foncier: '',
    destination_terrain: 'HABITATION' as 'HABITATION' | 'INDUSTRIEL' | 'COMMERCIAL',
    valeur_unitaire: '',
    montant_total: '',
    montant_lettres: '',
    zone_constructible: 'constructible' as 'constructible' | 'inconstructible',
    
    // Informations supplémentaires
    plan_urbanisme: 'PU1' as 'PU1' | 'PU2' | 'PU3' | 'PU4' | 'autre',
    matriculation_propriete: '',
    
    // Informations du contrevenant
    nom_contrevenant: '',
    cin_contrevenant: '',
    contact_contrevenant: '',
    adresse_contrevenant: '',
    
    statut: 'fini' as 'fini' | 'en_cours' | 'annule',

    // Nouveau champ pour la date limite
    date_delai_payment: ''
  });

  const [calculDetails, setCalculDetails] = useState({
    redevance: 0,
    amende: 0,
    total: 0
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingAP, setExistingAP] = useState<any>(null); // ✅ Pour stocker l'AP existant

  // ✅ NOUVELLE FONCTION : Charger l'AP existant
  const loadExistingAP = async () => {
    try {
      console.log(`🔄 Chargement de l'AP existant pour FT ID: ${ft.id}`);
      
      const response = await fetch(`http://localhost:3000/api/ap/ft/${ft.id}/ap`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setExistingAP(data.data);
          console.log('✅ AP existant trouvé:', data.data);
          
          // Pré-remplir le formulaire avec les données existantes
          setFormData(prev => ({
            ...prev,
            numero_avis: data.data.num_ap || '',
            date_ap: data.data.date_ap || '',
            date_descente: data.data.date_descente || '',
            titre_foncier: data.data.titre_terrain || '',
            superficie_terrain: data.data.superficie?.toString() || '',
            localite: data.data.localite || '',
            zone_type: data.data.zone_geographique || 'CUA',
            plan_urbanisme: data.data.pu_plan_urbanisme || 'PU1',
            montant_total: data.data.montant_chiffre?.toString() || '',
            montant_lettres: data.data.montant_lettre || '',
            motif: data.data.infraction || '',
            date_delai_payment: data.data.date_delai_payment || '',
            statut: data.data.statut || 'fini'
          }));
        }
      } else {
        console.log('ℹ️ Aucun AP existant trouvé, utilisation des valeurs par défaut');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'AP existant:', error);
      // Continuer avec les valeurs par défaut
    }
  };

  // CORRECTION : Fonction améliorée pour générer le numéro d'avis
  const useBasicFTData = (ftData: FTData) => {
    const generateNumeroAvis = () => {
      // ✅ Si un AP existe déjà, utiliser son numéro
      if (existingAP?.num_ap) {
        return existingAP.num_ap;
      }
      
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
      
      return `AVIS-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
    };

    const formatDateForInput = (dateString: string) => {
      if (!dateString) return new Date().toISOString().split('T')[0];
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch {
        return new Date().toISOString().split('T')[0];
      }
    };

    const determineDestination = () => {
      const motif = ftData.motif?.toLowerCase() || '';
      if (motif.includes('industriel')) return 'INDUSTRIEL';
      if (motif.includes('commercial')) return 'COMMERCIAL';
      return 'HABITATION';
    };

    const determineZoneConstructible = () => {
      const infraction = ftData.infraction?.toLowerCase() || '';
      if (infraction.includes('inconstructible') || infraction.includes('zone rouge')) {
        return 'inconstructible';
      }
      return 'constructible';
    };

    return {
      numero_avis: generateNumeroAvis(),
      date_faire_ap: existingAP?.date_ap || new Date().toISOString().split('T')[0], // ✅ Utiliser la date existante si disponible
      date_descente: formatDateForInput(ftData.date_ft),
      num_descente: ftData.id_descente || `DESC-${ftData.id}`,
      num_ft: ftData.reference_ft || '',
      localite: ftData.localite || ftData.commune || 'Non spécifié',
      coord_x: ftData.coord_x?.toString() || '',
      coord_y: ftData.coord_y?.toString() || '',
      superficie_terrain: ftData.superficie?.toString() || '0',
      nomproprietaire: ftData.nomproprietaire || ftData.nom_complet || '',
      titre_foncier: ftData.titre_terrain || '',
      destination_terrain: determineDestination(),
      motif: ftData.infraction 
        ? `Amende pour infraction: ${ftData.infraction}`
        : `Paiement pour ${ftData.motif || 'fait-terrain'}`,
      zone_constructible: determineZoneConstructible(),
      nom_contrevenant: ftData.nom_complet || '',
      cin_contrevenant: ftData.cin || '',
      contact_contrevenant: ftData.contact || '',
      adresse_contrevenant: ftData.adresse || '',
      delai_payment: '15' as '8' | '15',
      statut: existingAP?.statut || 'en attente de paiement' // ✅ Utiliser le statut existant
    };
  };

  useEffect(() => {
    const initializeForm = async () => {
      try {
        // ✅ Charger d'abord l'AP existant
        await loadExistingAP();
        
        // Ensuite initialiser le formulaire
        const extractedData = useBasicFTData(ft);
        
        setFormData(prev => ({
          ...prev,
          ...extractedData
        }));

      } catch (err) {
        console.error('Erreur lors de l\'initialisation:', err);
        const extractedData = useBasicFTData(ft);
        setFormData(prev => ({
          ...prev,
          ...extractedData
        }));
      }
    };

    initializeForm();
  }, [ft]);

  // Calcul de la date limite de paiement
  useEffect(() => {
    if (formData.date_faire_ap && formData.delai_payment) {
      const apDate = new Date(formData.date_faire_ap);
      const days = parseInt(formData.delai_payment);
      const deadline = new Date(apDate);
      deadline.setDate(apDate.getDate() + days);
      const formatted = deadline.toISOString().split('T')[0];
      
      console.log('Calcul date limite:', {
        dateAP: formData.date_faire_ap,
        delai: formData.delai_payment,
        dateLimite: formatted
      });
      
      setFormData(prev => ({ ...prev, date_delai_payment: formatted }));
    }
  }, [formData.date_faire_ap, formData.delai_payment]);

  // Fonction pour calculer les valeurs
  const calculerValeurs = (
    zoneGeographique: 'CUA' | 'peripherie', 
    typePayment: string, 
    destination: string, 
    superficie: number,
    zoneConstructible: 'constructible' | 'inconstructible'
  ) => {
    const typeAttraction = mapDestinationToAttraction(destination);
    const calcul = calculerTaxesComplet(zoneConstructible, typeAttraction, superficie, zoneGeographique);
    
    const totalCalcul = calcul.redevance + calcul.amende;
    setCalculDetails({
      redevance: calcul.redevance,
      amende: calcul.amende,
      total: totalCalcul
    });
    
    let valeurUnitaire = 0;
    let montantTotal = 0;

    if (zoneConstructible === 'constructible') {
      if (typePayment === 'total') {
        valeurUnitaire = totalCalcul;
        montantTotal = superficie * totalCalcul;
      } else if (typePayment === 'amende') {
        valeurUnitaire = calcul.amende;
        montantTotal = superficie * calcul.amende;
      } else if (typePayment === 'redevance') {
        valeurUnitaire = calcul.redevance;
        montantTotal = superficie * calcul.redevance;
      }
    } else {
      valeurUnitaire = calcul.amende;
      montantTotal = superficie * calcul.amende;
    }
    
    return { valeurUnitaire, montantTotal };
  };

  // Calcul automatique des valeurs
  useEffect(() => {
    const sup = parseFloat(formData.superficie_terrain) || 0;
    const { valeurUnitaire, montantTotal } = calculerValeurs(
      formData.zone_type, 
      formData.type_payment, 
      formData.destination_terrain, 
      sup,
      formData.zone_constructible
    );
    
    const montantLettres = montantTotal > 0 ? convertToLetters(montantTotal) : '';
    
    setFormData(prev => ({
      ...prev,
      valeur_unitaire: valeurUnitaire.toFixed(0),
      montant_total: montantTotal.toFixed(0),
      montant_lettres: montantLettres
    }));
  }, [formData.zone_type, formData.type_payment, formData.destination_terrain, formData.superficie_terrain, formData.zone_constructible]);

  // Déterminer automatiquement le type de paiement
  useEffect(() => {
    const typePaiement = getTypePaiementSelonZone(formData.zone_constructible);
    setFormData(prev => ({
      ...prev,
      type_payment: typePaiement
    }));
  }, [formData.zone_constructible]);

  // ✅ CORRECTION : Fonction handleSubmit pour UPDATE seulement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Protection contre le double submit
    if (submitting) {
      console.log('⚠️ Submit déjà en cours, annulation...');
      return;
    }
    
    setSubmitting(true);
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const dateAp = new Date(formData.date_faire_ap);
      const dateApLocal = new Date(dateAp.getFullYear(), dateAp.getMonth(), dateAp.getDate());
      
      const dateDescente = new Date(formData.date_descente);
      const dateDescenteLocal = new Date(dateDescente.getFullYear(), dateDescente.getMonth(), dateDescente.getDate());

      // Validation des dates
      if (dateApLocal > todayLocal) {
        throw new Error('La date de l\'avis ne peut pas être dans le futur');
      }

      if (dateDescenteLocal > todayLocal) {
        throw new Error('La date de descente ne peut pas être dans le futur');
      }

      // VALIDATION DE LA DATE LIMITE
      if (!formData.date_delai_payment) {
        throw new Error('La date limite de paiement est requise');
      }

      const dateDelai = new Date(formData.date_delai_payment);
      const dateDelaiLocal = new Date(dateDelai.getFullYear(), dateDelai.getMonth(), dateDelai.getDate());

      if (dateDelaiLocal <= todayLocal) {
        throw new Error('La date limite de paiement doit être dans le futur');
      }

      const formatDateForBackend = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // ✅ DONNÉES POUR L'UPDATE (seulement les champs nécessaires)
      const paymentData = {
        num_ap: formData.numero_avis,
        date_ap: formatDateForBackend(formData.date_faire_ap),
        superficie: parseFloat(formData.superficie_terrain) || 0,
        zone_geographique: formData.zone_type, 
        pu_plan_urbanisme: formData.plan_urbanisme, 
        montant_chiffre: parseFloat(formData.montant_total) || 0,
        montant_lettre: formData.montant_lettres,
        statut: formData.statut,
        motif: formData.motif,
        date_delai_payment: formatDateForBackend(formData.date_delai_payment),
        date_descente: formatDateForBackend(formData.date_descente),
        titre_terrain: formData.titre_foncier,
        localite: formData.localite,
        destination_terrain: formData.destination_terrain,
        infraction: formData.motif
      };

      console.log('📦 Données envoyées au backend pour UPDATE:', paymentData);

      // ✅ UTILISER PUT AU LIEU DE POST
      const response = await fetch(`http://localhost:3000/api/ap/ft/${ft.id}/ap`, {
        method: 'PUT', // ✅ CHANGEMENT CRITIQUE ICI
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch {
          // Ignorer si on ne peut pas lire le corps de la réponse
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la mise à jour du paiement');
      }

      // ✅ Modifier le message de succès
      console.log('✅ AP mis à jour avec succès:', data.data);
      onUpdate(data.data || paymentData);
      onClose();
      
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du paiement.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour formater les nombres avec espaces
  const formatNumber = (num: string) => {
    return num ? parseInt(num).toLocaleString('fr-FR') : '';
  };

  // Fonction pour convertir le montant en lettres
  const convertToLetters = (amount: number): string => {
    const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
    const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
    const tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];
    
    if (amount === 0) return 'ZÉRO';
    
    let result = '';
    const millions = Math.floor(amount / 1000000);
    const thousands = Math.floor((amount % 1000000) / 1000);
    const remainder = amount % 1000;
    
    if (millions > 0) {
      if (millions === 1) {
        result += 'UN MILLION ';
      } else {
        result += convertSmallNumber(millions) + ' MILLIONS ';
      }
    }
    
    if (thousands > 0) {
      if (thousands === 1) {
        result += 'MILLE ';
      } else {
        result += convertSmallNumber(thousands) + ' MILLE ';
      }
    }
    
    if (remainder > 0) {
      result += convertSmallNumber(remainder);
    }
    
    return result.trim() + ' ARIARY';
    
    function convertSmallNumber(num: number): string {
      if (num === 0) return '';
      if (num < 10) return units[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) {
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        if (unit === 0) return tens[ten];
        if (ten === 7 || ten === 9) {
          return tens[ten - 1] + '-' + teens[unit];
        }
        return tens[ten] + '-' + units[unit];
      }
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      if (hundred === 1) {
        return rest === 0 ? 'CENT' : 'CENT ' + convertSmallNumber(rest);
      }
      return units[hundred] + ' CENT' + (rest === 0 ? 'S' : ' ' + convertSmallNumber(rest));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 p-4 transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-[60vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white z-10 rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <FileCheck className="w-6 h-6 text-green-600" />
              <span>
                {existingAP ? 'Mettre à jour l\'Avis de Paiement' : 'Compléter l\'Avis de Paiement'} {/* ✅ Texte dynamique */}
              </span>
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Pour le F.T. : <strong>{ft.reference_ft}</strong> - {ft.nom_complet}
            {existingAP && (
              <span className="ml-2 text-blue-600">
                • AP existant: {existingAP.num_ap}
              </span>
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          {/* Content */}
          <div className="p-6 overflow-y-auto flex-grow">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}



            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Section 1: Informations de l'avis */}
              <div className="md:col-span-2 space-y-4 border-b pb-4">
                <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">
                  Informations de l'Avis
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro Avis *
                    </label>
                    <input
                      type="text"
                      name="numero_avis"
                      value={formData.numero_avis}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      required
                      readOnly={!!existingAP} // ✅ Rendre readonly si AP existe
                    />
                    {existingAP && (
                      <p className="text-xs text-gray-500 mt-1">
                        Numéro AP existant - non modifiable
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de descente *
                    </label>
                    <input
                      type="date"
                      name="date_descente"
                      value={formData.date_descente}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date faire AP *
                    </label>
                    <input
                      type="date"
                      name="date_faire_ap"
                      value={formData.date_faire_ap}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      required
                      readOnly={!!existingAP} // ✅ Rendre readonly si AP existe
                    />
                    {existingAP && (
                      <p className="text-xs text-gray-500 mt-1">
                        Date AP existante - non modifiable
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut de l'AP
                    </label>
                    <div className="w-full px-3 py-2 border border-green-300 rounded-lg bg-green-50 text-green-700 font-medium">
                      ✅ {formData.statut === 'fini' ? 'Fini' : 'En cours'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {existingAP 
                        ? 'Statut existant préservé' 
                        : 'Le statut "Fini" est automatiquement attribué'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro F.T. *
                    </label>
                    <input
                      type="text"
                      name="num_ft"
                      value={formData.num_ft}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      required
                      readOnly
                    />
                  </div>
                </div>

                {/* Informations du contrevenant */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Informations du Contrevenant
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du contrevenant *
                      </label>
                      <input
                        type="text"
                        name="nom_contrevenant"
                        value={formData.nom_contrevenant}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CIN
                      </label>
                      <input
                        type="text"
                        name="cin_contrevenant"
                        value={formData.cin_contrevenant}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Numéro CIN"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact
                      </label>
                      <input
                        type="text"
                        name="contact_contrevenant"
                        value={formData.contact_contrevenant}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Numéro de téléphone"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse
                      </label>
                      <input
                        type="text"
                        name="adresse_contrevenant"
                        value={formData.adresse_contrevenant}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Adresse complète"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections restantes identiques... */}
              {/* Section 2: Informations du terrain */}
              <div className="md:col-span-2 space-y-4 border-b pb-4">
                <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">
                  Informations du Terrain
                </h4>
                
                {/* Radio buttons pour CUA/Périphérie */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Zone Géographique *
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="zone_type"
                        value="CUA"
                        checked={formData.zone_type === 'CUA'}
                        onChange={handleRadioChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">CUA (Communauté Urbaine d'Antananarivo)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="zone_type"
                        value="peripherie"
                        checked={formData.zone_type === 'peripherie'}
                        onChange={handleRadioChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Périphérie</span>
                    </label>
                  </div>
                </div>

                {/* Radio buttons pour Zone Constructible/Inconstructible */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type de Zone *
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="zone_constructible"
                        value="constructible"
                        checked={formData.zone_constructible === 'constructible'}
                        onChange={(e) => setFormData(prev => ({ ...prev, zone_constructible: e.target.value as 'constructible' | 'inconstructible' }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Zone Constructible (Amende + Redevance)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="zone_constructible"
                        value="inconstructible"
                        checked={formData.zone_constructible === 'inconstructible'}
                        onChange={(e) => setFormData(prev => ({ ...prev, zone_constructible: e.target.value as 'constructible' | 'inconstructible' }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Zone Inconstructible (Amende seulement)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PU (Plan d'Urbanisme) *
                    </label>
                    <select
                      name="plan_urbanisme"
                      value={formData.plan_urbanisme}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="PU1">PU1 - Zone d'habitation dense</option>
                      <option value="PU2">PU2 - Zone d'habitation moyenne</option>
                      <option value="PU3">PU3 - Zone d'habitation légère</option>
                      <option value="PU4">PU4 - Zone d'activités</option>
                      <option value="autre">Autre plan d'urbanisme</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matriculation Propriété
                    </label>
                    <input
                      type="text"
                      name="matriculation_propriete"
                      value={formData.matriculation_propriete}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Numéro de matriculation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coordonnée X
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="coord_x"
                      value={formData.coord_x}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Coordonnée X (longitude)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coordonnée Y
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="coord_y"
                      value={formData.coord_y}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Coordonnée Y (latitude)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Superficie terrain (m²) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="superficie_terrain"
                      value={formData.superficie_terrain}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Superficie totale"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du Propriétaire
                    </label>
                    <input
                      type="text"
                      name="nomproprietaire"
                      value={formData.nomproprietaire}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom du propriétaire du terrain"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Tableau de référence de calcul */}
              <div className="md:col-span-2 space-y-4 border-b pb-4">
                <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">
                  Tableau de Référence de Calcul
                </h4>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-4 gap-4 mb-4 font-medium text-gray-700">
                    <div>N° Titre</div>
                    <div>Destination</div>
                    <div>Superficie (m²)</div>
                    <div>Valeur unitaire (Ar)</div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <input
                        type="text"
                        name="titre_foncier"
                        value={formData.titre_foncier}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                        placeholder="N° Titre"
                      />
                    </div>
                    <div>
                      <select
                        name="destination_terrain"
                        value={formData.destination_terrain}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      >
                        <option value="HABITATION">HABITATION</option>
                        <option value="INDUSTRIEL">INDUSTRIEL</option>
                        <option value="COMMERCIAL">COMMERCIAL</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        name="superficie_terrain"
                        value={formData.superficie_terrain}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                        placeholder="Superficie (m²)"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="valeur_unitaire"
                        value={formData.valeur_unitaire}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                        placeholder="Valeur unitaire"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Détails du calcul */}
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-sm text-gray-600">
                      <strong>Détails du calcul:</strong> Zone {formData.zone_type === 'CUA' ? 'CUA' : 'Périphérie'} • 
                      Destination: {formData.destination_terrain} • 
                      Type: {formData.type_payment === 'amende' ? 'Amende' : formData.type_payment === 'redevance' ? 'Redevance' : 'Total (Amende + Redevance)'} •
                      Zone: {formData.zone_constructible === 'constructible' ? 'Constructible' : 'Inconstructible'}
                    </div>
                    {formData.zone_constructible === 'constructible' && (
                      <div className="mt-2 text-sm text-gray-700">
                        <div>• Redevance: {formatNumber(calculDetails.redevance.toString())} Ar</div>
                        <div>• Amende: {formatNumber(calculDetails.amende.toString())} Ar</div>
                        <div className="font-bold">• SOMME TOTALE: {formatNumber(calculDetails.total.toString())} Ar</div>
                      </div>
                    )}
                    {formData.zone_constructible === 'inconstructible' && (
                      <div className="mt-2 text-sm text-gray-700">
                        <div>• Amende seulement: {formatNumber(calculDetails.amende.toString())} Ar</div>
                        <div className="text-xs text-gray-500">(Pas de redevance pour zone inconstructible)</div>
                      </div>
                    )}
                  </div>

                  {/* Affichage du calcul */}
                  <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="text-center text-lg font-bold text-gray-800 mb-2">
                      CALCUL : {formatNumber(formData.superficie_terrain)} × {formatNumber(formData.valeur_unitaire)}
                    </div>
                    <div className="text-center text-2xl font-bold text-green-600">
                      = {formatNumber(formData.montant_total)} Ar
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-2">
                      {formData.type_payment === 'total' 
                        ? '(Total Amende + Redevance)' 
                        : formData.type_payment === 'amende' 
                          ? '(Amende seulement)' 
                          : '(Redevance seulement)'}
                    </div>
                  </div>
                </div>

                {/* Montant total en lettres */}
                {formData.montant_total && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant total en lettres
                    </label>
                    <div className="text-lg font-semibold text-gray-800 italic">
                      {formData.montant_lettres}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Informations légales */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">
                  Cadre Légal
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif du paiement *
                  </label>
                  <textarea
                    name="motif"
                    value={formData.motif}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Délai de paiement *
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delai_payment"
                        value="8"
                        checked={formData.delai_payment === '8'}
                        onChange={handleRadioChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">8 jours</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delai_payment"
                        value="15"
                        checked={formData.delai_payment === '15'}
                        onChange={handleRadioChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">15 jours</span>
                    </label>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite de paiement *
                  </label>
                  <input
                    type="date"
                    name="date_delai_payment"
                    value={formData.date_delai_payment}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg bg-green-50 font-medium text-green-700"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculée automatiquement : {formData.date_faire_ap} + {formData.delai_payment} jours
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={loading || submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>
                {loading ? 'En cours...' : 
                 existingAP ? 'Mettre à jour l\'AP' : 'Compléter l\'AP'} {/* ✅ Texte dynamique */}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaireAPComponent;
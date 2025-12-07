import React, { useState, useEffect } from 'react';
import {
  FileText, User, MapPin, Home, Archive, CheckCircle,
  ChevronLeft, ChevronRight, Calendar, Hash, Map, Ruler,
  Building, Target, ClipboardList, Clock, Search, X,
  AlertCircle, CheckCircle2, Download, Info, Waves,
  Plus, Eye
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Couleur principale : Bleu aqua/eau
const WATER_COLOR = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e'
};

// Composant Toast
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-[#0ea5e9]';
      case 'error': return 'bg-[#0369a1]';
      case 'warning': return 'bg-[#0284c7]';
      case 'info': return 'bg-[#0ea5e9]';
      default: return 'bg-[#0ea5e9]';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      case 'info': return <Waves className="w-5 h-5" />;
      default: return <Waves className="w-5 h-5" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 ${getBackgroundColor()} text-white p-4 rounded-xl shadow-lg flex items-center space-x-3 min-w-80 z-[9999] animate-in slide-in-from-right-full border border-[#bae6fd]`}>
      {getIcon()}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white hover:text-[#e0f2fe] transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Interface pour les données de rendez-vous
export interface RendezvousData {
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
  n_pv_pat?: string;
  n_fifafi?: string;
  action?: string;
  dossier_a_fournir?: string[] | null;
}

interface FaireFTProps {
  rendezvousData: RendezvousData;
  onFTComplete: () => void;
}

// Interface pour les données FT créées
interface CreatedFT {
  reference_ft: string;
  date_ft: string;
  nom_complet: string;
  status_dossier: string;
  dossiers_requis_descente?: string[];
  missing_dossiers?: string[];
  deadline_complement?: string;
  [key: string]: any;
}

function FaireFT({ rendezvousData, onFTComplete }: FaireFTProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdFT, setCreatedFT] = useState<CreatedFT | null>(null);
  const [dossiersFromRdv, setDossiersFromRdv] = useState<string[]>([]);
  const [missingDossiers, setMissingDossiers] = useState<string[]>([]);
  const [isDossierComplete, setIsDossierComplete] = useState(false);
  const [showValidationButton, setShowValidationButton] = useState(false);
  const [manualDossiers, setManualDossiers] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

  const [formData, setFormData] = useState({
    idDescente: '',
    numPV: '',
    commune: '',
    fokotany: '',
    localite: '',
    coordX: '',
    coordY: '',
    infraction: '',
    action: '',
    dossier: '',
    referenceFT: '',
    dateFT: '',
    heureFT: '',
    typeConvoquee: '',
    nomComplet: '',
    cin: '',
    contact: '',
    adresse: '',
    titreTerrain: '',
    nomproprietaire: '',
    localisation: '',
    superficie: '',
    motif: '',
    lieu: '',
    but: '',
    mesure: '',
    dossierType: [] as string[],
    durationComplement: '',
    deadline: ''
  });

  // Liste des options de dossiers possibles
  const dossierOptions = ['CSJ', 'Plan off', "PU (Permis d'Utilisation)", 'Permis de Construction', 'Permis de Remblais'];

  // Gestion des toasts
  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fonction pour générer une référence FT automatique
  const generateReferenceFT = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `FT-${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  // Fonction pour générer le contenu HTML du PDF
  const getPDFContent = (): string => {
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const formattedDateFT = formData.dateFT ? new Date(formData.dateFT).toLocaleDateString('fr-FR') : currentDate;
    const formattedHeureFT = formData.heureFT || '--:--';
    const dateDescente = rendezvousData.date_desce ? new Date(rendezvousData.date_desce).toLocaleDateString('fr-FR') : 'DATE DESCENTE';
    const heureDescente = rendezvousData.heure_descente || 'HEURE';

    return `
      <div style="font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.4; color: #000; padding: 15mm; max-width: 210mm;">
        <!-- En-tête avec trois colonnes -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 1px solid #333; padding-bottom: 15px;">
          <div style="flex: 1; text-align: center;">
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">MINISTERE DE LA</div>
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">DECENTRALISATION</div>
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">ET DE L'AMENAGEMENT DU</div>
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">TERRITOIRE</div>
            <div style="font-size: 10px; margin-bottom: 2px;">SECRETARIAT GENERAL</div>
            <div style="font-size: 10px; margin-bottom: 5px;">-------------------</div>
            <div style="font-style: italic; font-size: 10px; margin-bottom: 2px;">DIRECTION GENERALE</div>
            <div style="font-style: italic; font-size: 10px; margin-bottom: 2px;">DE L'AUTORITE POUR LA</div>
            <div style="font-style: italic; font-size: 10px; margin-bottom: 2px;">PROTECTION CONTRE LES</div>
            <div style="font-style: italic; font-size: 10px; margin-bottom: 2px;">INONDATIONS DE LA PLAINE</div>
            <div style="font-style: italic; font-size: 10px; margin-bottom: 2px;">D'ANTANANARIVO</div>
          </div>
          
          <div style="flex: 1; text-align: right;">
            <div style="font-size: 11px; margin-bottom: 3px;">Antananarivo, le ${currentDate}</div>
            <div style="font-size: 11px; margin-bottom: 3px;">Le Directeur Général</div>
            <div style="font-size: 11px; margin-bottom: 3px;">À</div>
            <div style="font-weight: bold; font-size: 11px;">Monsieur ${formData.nomComplet || 'NOM DU DESTINATAIRE'}</div>
          </div>
        </div>
        
        <!-- Numéro d'avis -->
        <div style="text-align: center; margin: 25px 0; font-weight: bold; font-size: 14px;">
          Fitanana an-Tsporatra n° <span style="text-decoration: underline;">${formData.referenceFT || 'REFERENCE'}</span>
        </div>        
        <!-- Corps du document -->
        <div style="text-align: justify;">
          <!-- Premier paragraphe -->
          <div style="margin-bottom: 15px; text-indent: 20px;">
            Conformément aux dispositions du <span style="font-style: italic;">décret gouvernemental n°2019-1543 du 11 Septembre 2019</span> 
            relatif à l'encadrement des travaux de remblaiement dans les zones sous la juridiction de l'APIPA, 
            et en application de la <span style="font-style: italic;">loi n°2015-052 du 03 Février 2016</span> concernant l'Aménagement du Territoire et l'Habitat ;
          </div>
          
          <!-- Deuxième paragraphe -->
          <div style="margin-bottom: 15px; text-indent: 20px;">
            Suite aux instructions émises par Monsieur le Directeur Général de l'APIPA, une descente sur terrain a été effectuée 
            le <span style="font-weight: bold;">${dateDescente}</span> à <span style="font-weight: bold;">${heureDescente}</span>, 
            situé à <span style="font-weight: bold;">${formData.commune || 'COMMUNE'}</span>, Fokontany <span style="font-weight: bold;">${formData.fokotany || 'FOKONTANY'}</span>, 
            Localité <span style="font-weight: bold;">${formData.localite || 'LOCALITE'}</span>. Le terrain identifié sous la référence 
            <span style="font-weight: bold;"> ${formData.titreTerrain || 'TITRE TERRAIN'}</span>, appartenant à 
            <span style="font-weight: bold;"> ${formData.nomproprietaire || formData.nomComplet || 'NOM PROPRIETAIRE'}</span>, 
            aux coordonnées <span style="font-weight: bold;">${formData.coordX || 'X'}</span> ; <span style="font-weight: bold;">${formData.coordY || 'Y'}</span> 
            d'une superficie de <span style="font-weight: bold;">${formData.superficie || 'SUPERFICIE'}</span> m².
          </div>
          
          <div style="margin-bottom: 15px; text-indent: 20px;">
            Il a été constaté la présence d'<span style="font-weight: bold;">${formData.infraction || 'INFRACTION'}</span> sur ledit terrain, 
            ce qui a nécessité la prise de mesures immédiates dont <span style="font-weight: bold;">${formData.action || 'ACTION'}</span>.
          </div>
          
          <div style="margin-bottom: 15px; text-indent: 20px;">
            Vous êtes convoqué(e) au bureau de l'APIPA le <span style="font-weight: bold;">${formattedDateFT}</span> 
            à <span style="font-weight: bold;">${formattedHeureFT}</span> en qualité de <span style="font-weight: bold;">${formData.typeConvoquee || 'TYPE PERSONNE'}</span>, 
            <span style="font-weight: bold;"> ${formData.nomComplet || 'NOM COMPLET'}</span>, titulaire de la CIN n° 
            <span style="font-weight: bold;"> ${formData.cin || 'CIN'}</span>, joignable au <span style="font-weight: bold;">${formData.contact || 'CONTACT'}</span>.
          </div>
          
          <!-- Documents apportés -->
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; margin-bottom: 5px;">Documents présentés :</div>
            <ul style="margin-left: 25px; margin-bottom: 10px;">
              ${formData.dossierType && formData.dossierType.length > 0 
                ? formData.dossierType.map(doc => `<li>— ${doc}</li>`).join('')
                : `<li>— Aucun document présenté</li>`
              }
            </ul>
          </div>
          
          <!-- Documents manquants -->
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; margin-bottom: 5px;">Documents manquants à fournir :</div>
            <ul style="margin-left: 25px; margin-bottom: 10px;">
              ${missingDossiers && missingDossiers.length > 0 
                ? missingDossiers.map(doc => `<li>— ${doc}</li>`).join('')
                : `<li>— Aucun document manquant</li>`
              }
            </ul>
            ${formData.deadline ? `
              <div style="font-weight: bold; margin-top: 10px;">
                Date limite de dépôt : <span style="text-decoration: underline;">${new Date(formData.deadline).toLocaleDateString('fr-FR')}</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Mesures requises -->
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; margin-bottom: 5px;">Mesures requises par l'APIPA :</div>
            <div style="text-indent: 20px; margin-bottom: 10px;">
              ${formData.mesure || 'Conformité aux réglementations en vigueur concernant les travaux de remblaiement et respect des procédures administratives.'}
            </div>
          </div>
          
          <!-- Avertissement -->
          <div style="margin-bottom: 15px; text-indent: 20px;">
            Il est impératif de respecter l'ensemble des prescriptions mentionnées ci-dessus. Tout manquement, même partiel, 
            sera considéré comme une infraction et pourra entraîner l'engagement de poursuites judiciaires par les autorités compétentes.
          </div>
          
          <!-- Conclusion -->
          <div style="margin-bottom: 20px; text-indent: 20px;">
            Pour attester de la prise de connaissance du présent avis et de l'engagement à respecter les prescriptions de l'APIPA, 
            veuillez signer ce document en double exemplaire.
          </div>
        </div>
        
        <!-- Sections de signature -->
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-weight: bold; margin-bottom: 20px;">Lu et approuvé,</div>
            <div style="border-top: 1px solid #000; width: 300px; padding-top: 5px;">
              <div style="text-align: center; font-style: italic;">Signature du destinataire</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; margin-bottom: 5px;">Antananarivo, le ${currentDate}</div>
            <div style="font-style: italic; margin-bottom: 20px;">Le Directeur Général de l'APIPA</div>
            <div style="border-top: 1px solid #000; width: 300px; margin-left: auto; padding-top: 5px;">
              <div style="text-align: center; font-style: italic;">Signature et cachet</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Fonction pour générer le PDF APIPA
  const generateAPIPAPDF = async (): Promise<void> => {
    try {
      console.log('🔄 Début de la génération du PDF APIPA...');

      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'fixed';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      pdfContainer.style.width = '210mm';
      pdfContainer.style.minHeight = '297mm';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.padding = '0';
      pdfContainer.style.boxSizing = 'border-box';
      pdfContainer.style.fontFamily = 'Times New Roman, serif';
      pdfContainer.style.fontSize = '12px';
      pdfContainer.style.lineHeight = '1.4';
      pdfContainer.style.color = '#000000';

      pdfContainer.innerHTML = getPDFContent();
      document.body.appendChild(pdfContainer);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: pdfContainer.scrollWidth,
        height: pdfContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      document.body.removeChild(pdfContainer);

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas vide - dimensions nulles');
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Avis_APIPA_${formData.referenceFT}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF généré avec succès:', fileName);
      addToast('PDF généré avec succès', 'success');

    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      addToast('Erreur lors de la génération du PDF', 'error');
    }
  };

  // Pré-remplir automatiquement la référence FT
  useEffect(() => {
    if (currentStep === 1 && !formData.referenceFT) {
      const autoReference = generateReferenceFT();
      setFormData(prev => ({ ...prev, referenceFT: autoReference }));
    }
  }, [currentStep, formData.referenceFT]);

  // Fonction pour formater les dossiers à fournir
  const formatDossiersAFournir = (dossiers: any, infraction: string): string[] => {
    if (!dossiers) {
      return getRequiredDossiers(infraction);
    }
    
    if (Array.isArray(dossiers)) {
      return dossiers;
    }
    
    if (typeof dossiers === 'string') {
      try {
        const parsed = JSON.parse(dossiers);
        return Array.isArray(parsed) ? parsed : [dossiers];
      } catch {
        return [dossiers];
      }
    }
    
    return getRequiredDossiers(infraction);
  };

  // Fonction pour comparer les dossiers et calculer les manquants
  const calculateMissingDossiers = (required: string[], selected: string[]) => {
    const missing = required.filter(d => !selected.includes(d));
    const isComplete = missing.length === 0;
    
    setMissingDossiers(missing);
    setIsDossierComplete(isComplete);
    
    return { missing, isComplete };
  };

  // Remplissage automatique UNIQUEMENT de la première page (Info Descente)
  useEffect(() => {
    if (rendezvousData) {
      const dossiersFormates = formatDossiersAFournir(rendezvousData.dossier_a_fournir, rendezvousData.infraction);
      setDossiersFromRdv(dossiersFormates);

      const dossiersString = dossiersFormates.length > 0 
        ? `Dossiers requis: ${dossiersFormates.join(', ')}` 
        : (rendezvousData.n_fifafi || 'Aucun dossier requis');

      setFormData(prev => ({
        ...prev,
        idDescente: rendezvousData.id || '',
        numPV: rendezvousData.n_pv_pat || '',
        commune: rendezvousData.commune || '',
        fokotany: rendezvousData.fokontany || '',
        localite: rendezvousData.localite || '',
        coordX: rendezvousData.coord_x?.toString() || '',
        coordY: rendezvousData.coord_y?.toString() || '',
        infraction: rendezvousData.infraction || '',
        dossier: dossiersString,
        action: rendezvousData.action || '',
        dossierType: [],
      }));

      calculateMissingDossiers(dossiersFormates, []);
    }
  }, [rendezvousData]);

  // Recalculer les dossiers manquants
  useEffect(() => {
    const requiredDossiers = manualDossiers ? manualDossiers.split(',').map(d => d.trim()).filter(d => d) : dossiersFromRdv;
    calculateMissingDossiers(requiredDossiers, formData.dossierType);
  }, [formData.dossierType, dossiersFromRdv, manualDossiers]);

  // Calcul de la deadline
  useEffect(() => {
    if (formData.durationComplement && formData.dateFT && currentStep === 5) {
      if (!isDossierComplete) {
        const date = new Date(formData.dateFT);
        date.setDate(date.getDate() + parseInt(formData.durationComplement));
        setFormData(prev => ({ ...prev, deadline: date.toISOString().split('T')[0] }));
      } else {
        setFormData(prev => ({ ...prev, deadline: '', durationComplement: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, deadline: '' }));
    }
  }, [formData.durationComplement, formData.dateFT, isDossierComplete, currentStep]);

  // Pagination réduite - seulement 3 étapes principales
  const steps = [
    { title: 'Informations Générales', icon: Search },
    { title: 'Personne & Terrain', icon: User },
    { title: 'Détails & Validation', icon: FileText }
  ];

  const getRequiredDossiers = (infraction: string): string[] => {
    if (!infraction) return [];
    const lower = infraction.toLowerCase();
    return dossierOptions.filter(option => {
      const optLower = option.toLowerCase();
      if (lower.includes('csj') && optLower.includes('csj')) return true;
      if (lower.includes('plan') && optLower.includes('plan')) return true;
      if (lower.includes('utilisation') && optLower.includes('utilisation')) return true;
      if (lower.includes('construction') && optLower.includes('construction')) return true;
      if (lower.includes('remblais') && optLower.includes('remblais')) return true;
      return false;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && name === 'dossierType') {
      const checkbox = e.target as HTMLInputElement;
      const newDossierType = checkbox.checked 
        ? [...formData.dossierType, value] 
        : formData.dossierType.filter(t => t !== value);
      setFormData(prev => ({
        ...prev,
        dossierType: newDossierType
      }));
    } else if (name === 'manualDossiers') {
      setManualDossiers(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) return formData.idDescente && formData.numPV && formData.commune && formData.referenceFT && formData.dateFT && formData.heureFT;
    if (currentStep === 1) return formData.typeConvoquee && formData.nomComplet && formData.cin && formData.contact && formData.titreTerrain;
    if (currentStep === 2) return true;
    return true;
  };

  const openConfirmationModal = () => {
    if (!isStepValid()) {
      addToast("Veuillez remplir tous les champs obligatoires", 'warning');
      return;
    }
    setShowConfirmationModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmationModal(false);
    await handleSubmit();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSubmitting(true);
    setApiError('');
    
    try {
      const requiredDossiers = manualDossiers ? manualDossiers.split(',').map(d => d.trim()).filter(d => d) : dossiersFromRdv;
      const hasRequiredDossiers = requiredDossiers.length > 0;
      const finalStatus = hasRequiredDossiers ? 
        (isDossierComplete ? 'regularise' : 'irregularise') : 
        'sans_dossier';

      const ftData = {
        rendezvous_id: parseInt(rendezvousData.id),
        reference_ft: formData.referenceFT,
        date_ft: formData.dateFT,
        heure_ft: formData.heureFT,
        type_convoquee: formData.typeConvoquee,
        nom_complet: formData.nomComplet,
        cin: formData.cin,
        contact: formData.contact,
        adresse: formData.adresse,
        titre_terrain: formData.titreTerrain,
        nomproprietaire: formData.nomproprietaire,
        localisation: formData.localisation,
        superficie: formData.superficie ? parseFloat(formData.superficie) : null,
        motif: formData.motif,
        lieu: formData.lieu,
        but: formData.but,
        mesure: formData.mesure,
        dossier_type: formData.dossierType,
        dossiers_requis_descente: requiredDossiers,
        dossiers_requis_auto: getRequiredDossiers(formData.infraction),
        id_descente: formData.idDescente,
        num_pv: formData.numPV,
        commune: formData.commune,
        fokotany: formData.fokotany,
        localite: formData.localite,
        coord_x: formData.coordX ? parseFloat(formData.coordX) : null,
        coord_y: formData.coordY ? parseFloat(formData.coordY) : null,
        infraction: formData.infraction,
        dossier: formData.dossier,
        action: formData.action,
        status_dossier: finalStatus,
        missing_dossiers: missingDossiers,
        duration_complement: formData.durationComplement ? parseInt(formData.durationComplement) : null,
        deadline_complement: formData.deadline || null
      };

      const response = await fetch('http://localhost:3000/api/ft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ftData)
      });

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        if (response.status === 404) {
          throw new Error(`Endpoint API non trouvé (404). Vérifiez que la route /api/ft existe sur le serveur.`);
        } else if (response.status >= 500) {
          throw new Error(`Erreur serveur (${response.status}). Consultez les logs du serveur.`);
        } else {
          throw new Error(`Réponse inattendue du serveur (${response.status}): ${textResponse.substring(0, 200)}`);
        }
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Erreur HTTP: ${response.status}`);
      }

      if (result.success) {
        setCreatedFT(result.data);
        
        // Mettre à jour le statut du rendez-vous
        try {
          await fetch(`http://localhost:3000/api/rendezvous/${rendezvousData.id}/statut`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              statut: 'Avec comparution'
            })
          });
        } catch (updateError) {
          console.warn('⚠️ Erreur lors de la mise à jour du statut du rendez-vous:', updateError);
        }

        setShowSuccessModal(true);
        addToast('F.T. créé avec succès', 'success');
        
      } else {
        throw new Error(result.message || 'Erreur lors de la création du F.T.');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du F.T.:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setApiError(errorMessage);
      addToast(`Erreur lors de la création du F.T.: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onFTComplete();
  };

  const handleGeneratePDF = () => {
    setShowSuccessModal(false);
    setShowPdfModal(true);
  };

  const handleDownloadPDF = async () => {
    await generateAPIPAPDF();
    setShowPdfModal(false);
    onFTComplete();
  };

  // Fonction pour afficher le bouton de validation
  const showValidation = () => {
    setShowValidationButton(true);
  };

  // Fonction pour gérer les boutons de durée
  const handleDurationSelect = (days: string) => {
    setFormData(prev => ({ 
      ...prev, 
      durationComplement: prev.durationComplement === days ? '' : days 
    }));
  };

  // Fonction pour obtenir le message de statut final
  const getStatusMessage = () => {
    const requiredDossiers = manualDossiers ? manualDossiers.split(',').map(d => d.trim()).filter(d => d) : dossiersFromRdv;
    const hasRequiredDossiers = requiredDossiers.length > 0;
    
    if (!hasRequiredDossiers) {
      return {
        title: 'F.T. Sans Dossier Requis',
        message: 'Aucun dossier requis identifié. Le F.T. peut être créé sans restriction.',
        type: 'info' as const,
        apPossible: true
      };
    }
    
    if (isDossierComplete) {
      return {
        title: 'F.T. Régularisé - AP Possible',
        message: 'Tous les dossiers requis ont été fournis. Vous pouvez procéder à l\'AP.',
        type: 'success' as const,
        apPossible: true
      };
    } else {
      return {
        title: 'F.T. Irrégularisé - AP Impossible',
        message: 'Certains dossiers requis manquent. L\'AP ne peut pas être effectué.',
        type: 'warning' as const,
        apPossible: false
      };
    }
  };

  const renderStepContent = () => {
    const statusInfo = getStatusMessage();
    const requiredDossiers = manualDossiers ? manualDossiers.split(',').map(d => d.trim()).filter(d => d) : dossiersFromRdv;
    const hasRequiredDossiers = requiredDossiers.length > 0;

    const fields = [
      // Step 0 - Informations Générales (fusion des étapes 0 et 1)
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto pr-2">
        <div className="space-y-4">
          <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
            <h3 className="font-medium text-[#0369a1] mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Informations de Descente
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4" />
                  ID Descente 
                </label>
                <input 
                  type="text" 
                  name="idDescente" 
                  value={formData.idDescente} 
                  onChange={handleChange} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  placeholder="ID de la descente" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Numéro PV 
                </label>
                <input 
                  type="text" 
                  name="numPV" 
                  value={formData.numPV} 
                  onChange={handleChange} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  placeholder="Numéro du PV" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4" />
                    Commune 
                  </label>
                  <input 
                    type="text" 
                    name="commune" 
                    value={formData.commune} 
                    onChange={handleChange} 
                    className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                    placeholder="Commune" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Fokotany
                  </label>
                  <input 
                    type="text" 
                    name="fokotany" 
                    value={formData.fokotany} 
                    onChange={handleChange} 
                    className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                    placeholder="Fokotany" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
            <h3 className="font-medium text-[#0369a1] mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Détails de l'Infraction
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" />
                  Infraction
                </label>
                <textarea 
                  name="infraction" 
                  value={formData.infraction} 
                  onChange={handleChange} 
                  placeholder="Description de l'infraction" 
                  rows={3} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all resize-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" />
                  Action
                </label>
                <input 
                  type="text" 
                  name="action" 
                  value={formData.action} 
                  onChange={handleChange} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  placeholder="Action entreprise" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
            <h3 className="font-medium text-[#0369a1] mb-3 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Référence F.T.
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4" />
                  Référence 
                </label>
                <input 
                  type="text" 
                  name="referenceFT" 
                  value={formData.referenceFT} 
                  onChange={handleChange} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  placeholder="Référence FT" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Date 
                  </label>
                  <input 
                    type="date" 
                    name="dateFT" 
                    value={formData.dateFT} 
                    onChange={handleChange} 
                    className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    Heure 
                  </label>
                  <input 
                    type="time" 
                    name="heureFT" 
                    value={formData.heureFT} 
                    onChange={handleChange} 
                    className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
            <h3 className="font-medium text-[#0369a1] mb-3 flex items-center gap-2">
              <Map className="w-4 h-4" />
              Localisation
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Localité
                </label>
                <input 
                  type="text" 
                  name="localite" 
                  value={formData.localite} 
                  onChange={handleChange} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  placeholder="Localité" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4" />
                    Coord. X
                  </label>
                  <input 
                    type="text" 
                    name="coordX" 
                    value={formData.coordX} 
                    onChange={handleChange} 
                    className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                    placeholder="X" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4" />
                    Coord. Y
                  </label>
                  <input 
                    type="text" 
                    name="coordY" 
                    value={formData.coordY} 
                    onChange={handleChange} 
                    className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                    placeholder="Y" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,

      // Step 1 - Personne & Terrain (fusion des étapes 2 et 3)
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto pr-2">
        <div className="space-y-4">
          <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
            <h3 className="font-medium text-[#0369a1] mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personne Convoquée
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Type de personne
                </label>
                <select 
                  name="typeConvoquee" 
                  value={formData.typeConvoquee} 
                  onChange={handleChange} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all"
                >
                  <option value="">Sélectionnez le type</option>
                  <option value="proprietaire">Propriétaire</option>
                  <option value="representant">Représentant</option>
                  <option value="locataire">Locataire</option>
                  <option value="occupant">Occupant</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Nom complet 
                </label>
                <input 
                  type="text" 
                  name="nomComplet" 
                  value={formData.nomComplet} 
                  onChange={handleChange} 
                  placeholder="Nom complet" 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4" />
                    CIN 
                  </label>
                  <input 
                    type="text" 
                    name="cin" 
                    value={formData.cin} 
                    onChange={handleChange} 
                    placeholder="CIN" 
                    className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    Contact 
                  </label>
                  <input 
                    type="text" 
                    name="contact" 
                    value={formData.contact} 
                    onChange={handleChange} 
                    placeholder="Téléphone" 
                    className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Adresse 
                </label>
                <textarea 
                  name="adresse" 
                  value={formData.adresse} 
                  onChange={handleChange} 
                  placeholder="Adresse complète" 
                  rows={2} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all resize-none" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
            <h3 className="font-medium text-[#0369a1] mb-3 flex items-center gap-2">
              <Home className="w-4 h-4" />
              Information du Terrain
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Titre du terrain
                </label>
                <input 
                  type="text" 
                  name="titreTerrain" 
                  value={formData.titreTerrain} 
                  onChange={handleChange} 
                  placeholder="Titre de propriété" 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Nom propriétaire
                </label>
                <input 
                  type="text" 
                  name="nomproprietaire" 
                  value={formData.nomproprietaire} 
                  onChange={handleChange} 
                  placeholder="Nom du propriétaire" 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <Map className="w-4 h-4" />
                  Localisation
                </label>
                <input 
                  type="text" 
                  name="localisation" 
                  value={formData.localisation} 
                  onChange={handleChange} 
                  placeholder="Localisation précise" 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <Ruler className="w-4 h-4" />
                  Superficie (m²)
                </label>
                <input 
                  type="number" 
                  name="superficie" 
                  value={formData.superficie} 
                  onChange={handleChange} 
                  placeholder="Superficie en m²" 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>,

      // Step 2 - Détails & Validation (fusion des étapes 4 et 5)
      <div className="h-full overflow-y-auto pr-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
            <h3 className="font-medium text-[#0369a1] mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Motif & Détails
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" />
                  Motif
                </label>
                <input 
                  type="text" 
                  name="motif" 
                  value={formData.motif} 
                  onChange={handleChange} 
                  placeholder="Motif de la convocation" 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Lieu
                </label>
                <input 
                  type="text" 
                  name="lieu" 
                  value={formData.lieu} 
                  onChange={handleChange} 
                  placeholder="Lieu de la convocation" 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" />
                  But
                </label>
                <input 
                  type="text" 
                  name="but" 
                  value={formData.but} 
                  onChange={handleChange} 
                  placeholder="But de la convocation" 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                />
              </div>
            </div>
          </div>
          
          <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
            <h3 className="font-medium text-[#0369a1] mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Mesures
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4" />
                  Mesure
                </label>
                <textarea 
                  name="mesure" 
                  value={formData.mesure} 
                  onChange={handleChange} 
                  placeholder="Mesures à prendre ou recommandations" 
                  rows={4} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all resize-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Type de Dossier */}
        <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
          <div className="space-y-4">
            {/* Champ pour définir les dossiers requis manuellement */}
            {(!dossiersFromRdv || dossiersFromRdv.length === 0) && (
              <div>
                <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Définir les dossiers requis (optionnel)
                </label>
                <input 
                  type="text" 
                  name="manualDossiers" 
                  value={manualDossiers} 
                  onChange={handleChange} 
                  className="w-full border border-[#bae6fd] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all" 
                  placeholder="Entrez les dossiers requis, séparés par des virgules (ex: CSJ, Permis de Construction)"
                />
                <p className="text-xs text-[#0284c7] mt-2">
                  Optionnel - Laissez vide si aucun dossier requis
                </p>
              </div>
            )}

            <label className="text-sm font-medium text-[#0369a1] flex items-center gap-2 mb-3">
              <Home className="w-4 h-4" />
              Type de dossier (optionnel)
              {(dossiersFromRdv.length > 0 || manualDossiers) && (
                <span className="text-xs text-[#0ea5e9] bg-white px-2 py-1 rounded-full border border-[#bae6fd]">
                  {(manualDossiers ? manualDossiers.split(',').map(d => d.trim()).filter(d => d) : dossiersFromRdv).length} dossier(s) requis
                </span>
              )}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dossierOptions.map(option => {
                const requiredDossiers = manualDossiers ? manualDossiers.split(',').map(d => d.trim()).filter(d => d) : dossiersFromRdv;
                const isPreSelected = requiredDossiers.includes(option);
                const isSelected = formData.dossierType.includes(option);
                return (
                  <label key={option} className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-white transition-colors text-sm ${
                    isPreSelected ? 'bg-white border-[#bae6fd]' : 'border-[#bae6fd]'
                  } ${
                    isPreSelected && !isSelected ? 'border-[#fecaca] bg-[#fef2f2]' : ''
                  }`}>
                    <input 
                      type="checkbox" 
                      name="dossierType" 
                      value={option} 
                      checked={isSelected} 
                      onChange={handleChange} 
                      className="w-4 h-4 text-[#0ea5e9] border-2 border-[#7dd3fc] rounded" 
                    />
                    <span className="text-[#0c4a6e]">
                      {option}
                      {isPreSelected && (
                        <span className={`text-xs ml-2 ${
                          isSelected ? 'text-[#0ea5e9]' : 'text-[#dc2626]'
                        }`}>
                          {isSelected ? '(fourni)' : '(manquant)'}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section de statut final */}
        <div className="bg-white p-4 rounded-xl border border-[#bae6fd] shadow-sm">
          <h3 className="font-medium text-[#0369a1] mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Statut final du F.T.
          </h3>
          
          <div className={`p-3 rounded-lg mb-4 ${
            statusInfo.type === 'success' ? 'bg-[#f0f9ff] border border-[#bae6fd]' :
            statusInfo.type === 'warning' ? 'bg-[#fefce8] border border-[#fef08a]' :
            'bg-[#f0f9ff] border border-[#bae6fd]'
          }`}>
            <div className="flex items-center gap-3">
              {statusInfo.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[#0ea5e9]" />
              ) : statusInfo.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-[#d97706]" />
              ) : (
                <Info className="w-5 h-5 text-[#0ea5e9]" />
              )}
              <div>
                <p className={`font-medium ${
                  statusInfo.type === 'success' ? 'text-[#0369a1]' :
                  statusInfo.type === 'warning' ? 'text-[#92400e]' :
                  'text-[#0369a1]'
                }`}>
                  {statusInfo.title}
                </p>
                <p className={`text-sm ${
                  statusInfo.type === 'success' ? 'text-[#0284c7]' :
                  statusInfo.type === 'warning' ? 'text-[#b45309]' :
                  'text-[#0284c7]'
                }`}>
                  {statusInfo.message}
                </p>
              </div>
            </div>
          </div>

          {/* Affichage conditionnel des dossiers manquants */}
          {hasRequiredDossiers && missingDossiers.length > 0 && (
            <div className="mt-4 p-3 bg-[#fefce8] border border-[#fef08a] rounded-lg">
              <h4 className="font-medium text-sm text-[#92400e] mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Dossiers manquants ({missingDossiers.length})
              </h4>
              <div className="space-y-2">
                {missingDossiers.map((dossier, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-[#b45309]">
                    <div className="w-2 h-2 bg-[#d97706] rounded-full"></div>
                    <span>{dossier}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#d97706] mt-2">
                ⚠️ Ces dossiers doivent être fournis pour pouvoir faire l'AP
              </p>
            </div>
          )}

          {/* Délai pour complément */}
          {!isDossierComplete && hasRequiredDossiers && (
            <div className="mt-4">
              <p className="text-sm font-medium text-[#0369a1] mb-2">Choisir la durée pour compléter le dossier :</p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => handleDurationSelect('8')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    formData.durationComplement === '8' 
                      ? 'bg-[#0ea5e9] text-white shadow-lg' 
                      : 'bg-white text-[#0369a1] hover:bg-[#e0f2fe] border border-[#bae6fd]'
                  }`}
                >
                  8 jours
                </button>
                <button 
                  type="button"
                  onClick={() => handleDurationSelect('15')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    formData.durationComplement === '15' 
                      ? 'bg-[#0ea5e9] text-white shadow-lg' 
                      : 'bg-white text-[#0369a1] hover:bg-[#e0f2fe] border border-[#bae6fd]'
                  }`}
                >
                  15 jours
                </button>
              </div>
              
              {formData.deadline && (
                <div className="mt-3 p-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg">
                  <p className="text-sm text-[#0369a1] font-medium">
                    📅 Date limite pour compléter les dossiers manquants: 
                    <span className="ml-1">{new Date(formData.deadline).toLocaleDateString('fr-FR')}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Résumé des dossiers */}
          {hasRequiredDossiers && (
            <div className="mt-4 p-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg">
              <h4 className="font-medium text-sm text-[#0369a1] mb-2">Résumé:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#0284c7]">Dossiers requis: <span className="font-medium text-[#0369a1]">{requiredDossiers.length}</span></p>
                  <p className="text-[#0284c7]">Dossiers fournis: <span className="font-medium text-[#0369a1]">{formData.dossierType.length}</span></p>
                </div>
                <div>
                  <p className="text-[#0284c7]">Dossiers manquants: <span className="font-medium text-[#0369a1]">{missingDossiers.length}</span></p>
                  <p className="text-[#0284c7]">Complétude: <span className={`font-medium ${
                    isDossierComplete ? 'text-[#0ea5e9]' : 'text-[#dc2626]'
                  }`}>
                    {isDossierComplete ? '100%' : `${Math.round((formData.dossierType.length / requiredDossiers.length) * 100)}%`}
                  </span></p>
                </div>
              </div>
            </div>
          )}

          {/* Affichage des erreurs API */}
          {apiError && (
            <div className="mt-4 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
              <h4 className="font-medium text-sm text-[#dc2626] mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Erreur de connexion
              </h4>
              <p className="text-sm text-[#dc2626]">{apiError}</p>
              <p className="text-xs text-[#dc2626] mt-2">
                💡 Solution: Vérifiez que le serveur backend est démarré sur http://localhost:3000
              </p>
            </div>
          )}

          {/* Bouton de validation */}
          <div className="mt-6 p-4 bg-white border border-[#bae6fd] rounded-lg shadow-sm">
            <h4 className="font-medium text-sm text-[#0369a1] mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Validation finale du F.T.
            </h4>
            <p className="text-sm text-[#0284c7] mb-4">
              {hasRequiredDossiers 
                ? 'Vérifiez que toutes les informations sont correctes avant de valider définitivement la Fiche de Travail.'
                : 'Aucun dossier requis identifié. Vous pouvez valider le F.T. sans restriction.'
              }
            </p>
            
            {!showValidationButton ? (
              <button
                type="button"
                onClick={showValidation}
                className="px-6 py-3 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <CheckCircle className="w-5 h-5" />
                Afficher le bouton de validation
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#0369a1] font-medium">
                  ✅ Vous pouvez maintenant valider la Fiche de Travail
                </p>
                <button
                  type="button"
                  onClick={openConfirmationModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2 w-full justify-center shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Valider définitivement le F.T.</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-[#0284c7]">
                  ⚠️ Attention : Cette action est irréversible. Le F.T. sera enregistré dans la base de données.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    ];

    return fields[currentStep];
  };

  // Composant pour le contenu PDF APIPA
  const APIPAPDFContent = () => {
    return (
      <div 
        className="pdf-preview bg-white p-8 max-w-4xl mx-auto border border-[#bae6fd] shadow-lg rounded-xl"
        style={{ 
          fontFamily: 'Times New Roman, serif',
          fontSize: '12px',
          lineHeight: '1.4',
          color: '#000',
          background: 'white'
        }}
        dangerouslySetInnerHTML={{ __html: getPDFContent() }}
      />
    );
  };

  // Modal de confirmation
  const renderConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 overflow-y-auto h-full w-full z-[3000] flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#bae6fd]">
        <div className="flex items-center justify-between p-6 border-b border-[#e0f2fe]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-[#e0f2fe]">
              <AlertCircle className="w-6 h-6 text-[#0284c7]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0c4a6e]">Confirmer la création</h3>
          </div>
          <button 
            onClick={() => setShowConfirmationModal(false)} 
            className="p-2 text-[#38bdf8] hover:text-[#0284c7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[#0369a1] mb-2">Êtes-vous sûr de vouloir créer cette Fiche de Travail ?</p>
          <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-4 mt-4">
            <h4 className="font-medium text-[#075985] mb-2">Résumé du F.T. :</h4>
            <div className="text-sm text-[#0369a1] space-y-1">
              <p><span className="font-medium">Référence :</span> {formData.referenceFT}</p>
              <p><span className="font-medium">Date :</span> {formData.dateFT}</p>
              <p><span className="font-medium">Personne :</span> {formData.nomComplet}</p>
              <p><span className="font-medium">Statut :</span> {getStatusMessage().title}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-[#e0f2fe] bg-[#f0f9ff] rounded-b-2xl">
          <button
            onClick={() => setShowConfirmationModal(false)}
            className="px-4 py-2 border border-[#7dd3fc] text-[#0369a1] rounded-lg hover:bg-[#e0f2fe] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={confirmSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] transition-colors ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enregistrement...</span>
              </div>
            ) : (
              'Confirmer'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Modal de succès avec option PDF
  const renderSuccessModal = () => {
    const statusInfo = getStatusMessage();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto border border-[#bae6fd]">
          <div className="flex items-center justify-between p-6 border-b border-[#e0f2fe]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#e0f2fe]">
                <CheckCircle className="w-6 h-6 text-[#0ea5e9]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0c4a6e]">
                F.T. Créé avec Succès
              </h3>
            </div>
            <button
              onClick={handleSuccessModalClose}
              className="p-2 text-[#38bdf8] hover:text-[#0284c7] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#e0f2fe] mb-4">
                <CheckCircle className="h-6 w-6 text-[#0ea5e9]" />
              </div>
              
              <h3 className="text-lg font-medium text-[#0c4a6e] mb-2">
                Fiche de Travail Validée
              </h3>
              
              <p className="text-sm text-[#0369a1] mb-4">
                La fiche de travail a été créée avec succès et enregistrée dans le système.
              </p>

              {createdFT && (
                <div className="bg-[#f0f9ff] rounded-xl p-4 mb-4 text-left border border-[#bae6fd]">
                  <h4 className="font-medium text-[#075985] mb-2">Détails du F.T. :</h4>
                  <div className="space-y-1 text-sm text-[#0369a1]">
                    <p><span className="font-medium">Référence :</span> {createdFT.reference_ft}</p>
                    <p><span className="font-medium">Date :</span> {new Date(createdFT.date_ft).toLocaleDateString('fr-FR')}</p>
                    <p><span className="font-medium">Personne :</span> {createdFT.nom_complet}</p>
                    <p><span className="font-medium">Statut :</span> <span className={
                      createdFT.status_dossier === 'regularise' ? 'text-[#0ea5e9] font-medium' :
                      createdFT.status_dossier === 'irregularise' ? 'text-[#dc2626] font-medium' :
                      'text-[#0ea5e9] font-medium'
                    }>
                      {createdFT.status_dossier === 'regularise' ? 'RÉGULARISÉ' : 
                       createdFT.status_dossier === 'irregularise' ? 'IRRÉGULARISÉ' : 
                       'SANS DOSSIER'}
                    </span></p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleGeneratePDF}
                  className="w-full px-4 py-3 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] transition-colors font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  Générer F.T APIPA
                </button>
                
                <button
                  onClick={handleSuccessModalClose}
                  className="w-full px-4 py-2 border border-[#7dd3fc] text-[#0369a1] rounded-lg hover:bg-[#e0f2fe] transition-colors"
                >
                  Retour à la liste
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal pour visualiser et télécharger le PDF
  const renderPdfModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-auto max-h-[90vh] flex flex-col border border-[#bae6fd]">
        <div className="flex items-center justify-between p-6 border-b border-[#e0f2fe]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#e0f2fe]">
              <FileText className="w-6 h-6 text-[#0ea5e9]" />
            </div>
            <h3 className="text-xl font-semibold text-[#0c4a6e]">
              Aperçu - F.T APIPA
            </h3>
          </div>
          <button
            onClick={() => setShowPdfModal(false)}
            className="p-2 text-[#38bdf8] hover:text-[#0284c7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-white">
          <APIPAPDFContent />
        </div>

        <div className="flex justify-between items-center p-6 border-t border-[#e0f2fe] bg-white">
          <button
            onClick={() => setShowPdfModal(false)}
            className="px-4 py-2 border border-[#7dd3fc] text-[#0369a1] rounded-lg hover:bg-[#e0f2fe] transition-colors"
          >
            Retour
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPdfModal(false);
                handleSuccessModalClose();
              }}
              className="px-4 py-2 border border-[#7dd3fc] text-[#0369a1] rounded-lg hover:bg-[#e0f2fe] transition-colors"
            >
              Terminer
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Télécharger le PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Container principal avec hauteur adaptée pour la modal */}
      <div className="bg-white border border-[#e0f2fe] shadow-sm rounded-2xl p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#e0f2fe]">
              {React.createElement(steps[currentStep].icon, { className: 'w-5 h-5 text-[#0284c7]' })}
            </div>
            <div>
              <h2 className="font-semibold text-lg text-[#0c4a6e]">
                Étape {currentStep + 1} sur {steps.length} : {steps[currentStep].title}
              </h2>
              <p className="text-sm text-[#0284c7] mt-1">
                Création de Fiche de Travail pour {rendezvousData.nom_personne_r}
              </p>
            </div>
          </div>
          {/* Pagination réduite */}
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`w-3 h-1 rounded-full ${i === currentStep ? 'bg-[#0ea5e9]' : 'bg-[#e0f2fe]'}`}></div>
            ))}
          </div>
        </div>

        {/* Contenu du formulaire avec hauteur flexible */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 border-t border-[#e0f2fe] pt-4">
          <button 
            type="button" 
            onClick={() => setCurrentStep(currentStep - 1)} 
            disabled={currentStep === 0 || isSubmitting} 
            className="px-4 py-2 border border-[#7dd3fc] rounded-lg flex items-center gap-2 text-[#0369a1] hover:bg-[#e0f2fe] disabled:opacity-50 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>

          {currentStep < steps.length - 1 ? (
            <button 
              type="button" 
              onClick={() => setCurrentStep(currentStep + 1)} 
              disabled={!isStepValid() || isSubmitting} 
              className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg flex items-center gap-2 hover:bg-[#0284c7] disabled:bg-gray-400 text-sm transition-colors shadow-lg hover:shadow-xl"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            !showValidationButton && (
              <div className="text-sm text-[#0284c7]">
                Cliquez sur "Afficher le bouton de validation" pour valider le F.T.
              </div>
            )
          )}
        </div>
      </div>

      {showConfirmationModal && renderConfirmationModal()}
      {showSuccessModal && renderSuccessModal()}
      {showPdfModal && renderPdfModal()}
    </>
  );
}

export default FaireFT;
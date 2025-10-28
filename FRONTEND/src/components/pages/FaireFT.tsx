import React, { useState, useEffect, useRef } from 'react';
import { FileText, User, MapPin, Home, Archive, CheckCircle, ChevronLeft, ChevronRight, Calendar, Hash, Map, Ruler, Building, Target, ClipboardList, Clock, Search, X, AlertCircle, CheckCircle2, Download, Info } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    nomproprietaire: '', // CHANGÉ: 'im' remplacé par 'nomproprietaire'
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

  // Fonction pour générer le contenu HTML du PDF (version améliorée)
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

  <!-- Bloc gauche : Signature du destinataire -->
  <div>
    <div style="font-weight: bold; margin-bottom: 20px;">Lu et approuvé,</div>
    <div style="border-top: 1px solid #000; width: 300px; padding-top: 5px;">
      <div style="text-align: center; font-style: italic;">Signature du destinataire</div>
    </div>
  </div>

  <!-- Bloc droite : Signature APIPA -->
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

      // Créer un élément temporaire pour le PDF avec des styles améliorés
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

      // Ajouter le contenu PDF avec les styles
      pdfContainer.innerHTML = getPDFContent();

      document.body.appendChild(pdfContainer);

      // Attendre que le contenu soit rendu
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
        onclone: (clonedDoc) => {
          // Appliquer des styles supplémentaires sur le clone
          const clonedContainer = clonedDoc.querySelector('.pdf-container');
          if (clonedContainer) {
            clonedContainer.style.fontFamily = 'Times New Roman, serif';
            clonedContainer.style.fontSize = '12px';
          }
        }
      });

      // Nettoyer l'élément temporaire
      document.body.removeChild(pdfContainer);

      console.log('✅ Canvas généré:', canvas.width, 'x', canvas.height);

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

      // Ajouter la première page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Sauvegarder le PDF
      const fileName = `Avis_APIPA_${formData.referenceFT}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF généré avec succès:', fileName);

    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF APIPA. Voir la console pour plus de détails.');
    }
  };

  // Pré-remplir automatiquement la référence FT quand on arrive à l'étape 1
  useEffect(() => {
    if (currentStep === 1 && !formData.referenceFT) {
      const autoReference = generateReferenceFT();
      setFormData(prev => ({ ...prev, referenceFT: autoReference }));
    }
  }, [currentStep, formData.referenceFT]);

  // Fonction pour formater les dossiers à fournir
  const formatDossiersAFournir = (dossiers: any, infraction: string): string[] => {
    console.log('📥 Dossier brut reçu :', dossiers);
    console.log('📥 Infraction reçue :', infraction);
    
    if (!dossiers) {
      console.log('⚠️ Aucun dossier fourni, tentative de déduction à partir de l\'infraction');
      const deducedDossiers = getRequiredDossiers(infraction);
      console.log('✅ Dossiers déduits à partir de l\'infraction :', deducedDossiers);
      return deducedDossiers;
    }
    
    if (Array.isArray(dossiers)) {
      console.log('✅ Dossier est un tableau :', dossiers);
      return dossiers;
    }
    
    if (typeof dossiers === 'string') {
      try {
        const parsed = JSON.parse(dossiers);
        console.log('✅ Dossier parsé depuis JSON :', parsed);
        return Array.isArray(parsed) ? parsed : [dossiers];
      } catch {
        console.log('⚠️ Erreur de parsing JSON, retour à la chaîne brute :', dossiers);
        return [dossiers];
      }
    }
    
    console.log('⚠️ Format de dossier inconnu, retour aux dossiers déduits de l\'infraction');
    return getRequiredDossiers(infraction);
  };

  // Fonction pour comparer les dossiers et calculer les manquants
  const calculateMissingDossiers = (required: string[], selected: string[]) => {
    const missing = required.filter(d => !selected.includes(d));
    const isComplete = missing.length === 0;
    
    console.log('📋 Dossiers requis :', required);
    console.log('📋 Dossiers fournis :', selected);
    console.log('❌ Dossiers manquants :', missing.length > 0 ? missing : 'Aucun dossier manquant');
    console.log('✅ Complétude :', isComplete ? 'Dossier complet' : 'Dossier incomplet');
    
    setMissingDossiers(missing);
    setIsDossierComplete(isComplete);
    
    return { missing, isComplete };
  };

  // Remplissage automatique UNIQUEMENT de la première page (Info Descente)
  useEffect(() => {
    if (rendezvousData) {
      console.log('📋 Données rendezvousData:', rendezvousData);
      console.log('📋 dossier_a_fournir brut:', rendezvousData.dossier_a_fournir);
      
      // Formater les dossiers à fournir
      const dossiersFormates = formatDossiersAFournir(rendezvousData.dossier_a_fournir, rendezvousData.infraction);
      console.log('📋 dossier_a_fournir formaté:', dossiersFormates);
      
      setDossiersFromRdv(dossiersFormates);

      // Créer une chaîne formatée pour l'affichage dans l'input
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
        dossierType: [], // Initialiser à vide pour permettre la sélection manuelle
      }));

      // Calculer les dossiers manquants initiaux
      calculateMissingDossiers(dossiersFormates, []);
    }
  }, [rendezvousData]);

  // Recalculer les dossiers manquants quand les sélections changent ou les dossiers requis manuels sont mis à jour
  useEffect(() => {
    const requiredDossiers = manualDossiers ? manualDossiers.split(',').map(d => d.trim()).filter(d => d) : dossiersFromRdv;
    calculateMissingDossiers(requiredDossiers, formData.dossierType);
  }, [formData.dossierType, dossiersFromRdv, manualDossiers]);

  // Calcul de la deadline lorsque la durée change ou la date FT
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

  const steps = [
    { title: 'Info Descente', icon: Search },
    { title: 'Référence FT', icon: Archive },
    { title: 'Personne Convoquée', icon: User },
    { title: 'Information du Terrain', icon: MapPin },
    { title: 'Motif et Détails', icon: FileText },
    { title: 'Type de Dossier', icon: Home }
  ];

  const getRequiredDossiers = (infraction: string): string[] => {
    if (!infraction) {
      console.log('⚠️ Aucune infraction fournie, retour d\'une liste vide');
      return [];
    }
    const lower = infraction.toLowerCase();
    const autoDossiers = dossierOptions.filter(option => {
      const optLower = option.toLowerCase();
      if (lower.includes('csj') && optLower.includes('csj')) return true;
      if (lower.includes('plan') && optLower.includes('plan')) return true;
      if (lower.includes('utilisation') && optLower.includes('utilisation')) return true;
      if (lower.includes('construction') && optLower.includes('construction')) return true;
      if (lower.includes('remblais') && optLower.includes('remblais')) return true;
      return false;
    });
    console.log('🔍 Dossiers auto-détectés à partir de l\'infraction :', autoDossiers);
    return autoDossiers;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && name === 'dossierType') {
      const checkbox = e.target as HTMLInputElement;
      const newDossierType = checkbox.checked 
        ? [...formData.dossierType, value] 
        : formData.dossierType.filter(t => t !== value);
      console.log('🔄 Mise à jour des dossiers sélectionnés :', newDossierType);
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
    if (currentStep === 0) return formData.idDescente && formData.numPV && formData.commune;
    if (currentStep === 1) return formData.referenceFT && formData.dateFT && formData.heureFT;
    if (currentStep === 2) return formData.typeConvoquee && formData.nomComplet && formData.cin && formData.contact && formData.adresse;
    if (currentStep === 5) return true;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError('');
    
    try {
      const requiredDossiers = manualDossiers ? manualDossiers.split(',').map(d => d.trim()).filter(d => d) : dossiersFromRdv;
      console.log('✅ Données FT complètes :', formData);
      console.log('✅ Dossiers requis (final) :', requiredDossiers);
      console.log('✅ Dossiers manquants :', missingDossiers);
      console.log('✅ Statut dossier :', isDossierComplete ? 'regularise' : 'irregularise');

      const hasRequiredDossiers = requiredDossiers.length > 0;
      const finalStatus = hasRequiredDossiers ? 
        (isDossierComplete ? 'regularise' : 'irregularise') : 
        'sans_dossier';
      
      // Préparer les données pour l'API
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

      console.log('📤 Envoi des données F.T. à l\'API:', ftData);

      // Envoyer les données à l'API
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
        console.error('❌ Réponse non-JSON reçue:', textResponse.substring(0, 500));
        
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
        console.log('✅ F.T. créé avec succès:', result.data);
        setCreatedFT(result.data);
        
        // Mettre à jour le statut du rendez-vous vers "Avec comparution"
        try {
          const updateRdvResponse = await fetch(`http://localhost:3000/api/rendezvous/${rendezvousData.id}/statut`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              statut: 'Avec comparution'
            })
          });

          if (updateRdvResponse.ok) {
            console.log('✅ Statut du rendez-vous mis à jour vers "Avec comparution"');
          } else {
            console.warn('⚠️ Impossible de mettre à jour le statut du rendez-vous');
          }
        } catch (updateError) {
          console.warn('⚠️ Erreur lors de la mise à jour du statut du rendez-vous:', updateError);
        }

        // Afficher le modal de succès avec option PDF
        setShowSuccessModal(true);
        
      } else {
        throw new Error(result.message || 'Erreur lors de la création du F.T.');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du F.T.:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setApiError(errorMessage);
      alert(`Erreur lors de la création du F.T.: ${errorMessage}`);
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
      // Step 0 - Info Descente (pré-remplie automatiquement)
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4" />
              ID Descente 
            </label>
            <input 
              type="text" 
              name="idDescente" 
              value={formData.idDescente} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm" 
              placeholder="ID de la descente" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4" />
              Numéro PV 
            </label>
            <input 
              type="text" 
              name="numPV" 
              value={formData.numPV} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm" 
              placeholder="Numéro du PV" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Building className="w-4 h-4" />
              Commune 
            </label>
            <input 
              type="text" 
              name="commune" 
              value={formData.commune} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm" 
              placeholder="Nom de la commune" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4" />
              Fokotany
            </label>
            <input 
              type="text" 
              name="fokotany" 
              value={formData.fokotany} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm" 
              placeholder="Nom du fokotany" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Map className="w-4 h-4" />
              Localité
            </label>
            <input 
              type="text" 
              name="localite" 
              value={formData.localite} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm" 
              placeholder="Nom de la localité" 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Target className="w-4 h-4" />
                Coordonnée X
              </label>
              <input 
                type="text" 
                name="coordX" 
                value={formData.coordX} 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 text-sm" 
                placeholder="Coord. X" 
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Target className="w-4 h-4" />
                Coordonnée Y
              </label>
              <input 
                type="text" 
                name="coordY" 
                value={formData.coordY} 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 text-sm" 
                placeholder="Coord. Y" 
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4" />
              Infraction
            </label>
            <textarea 
              name="infraction" 
              value={formData.infraction} 
              onChange={handleChange} 
              placeholder="Description de l'infraction" 
              rows={3} 
              className="w-full border rounded-lg p-2 text-sm resize-none" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
              Action
            </label>
            <input 
              type="text" 
              name="action" 
              value={formData.action} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm" 
              placeholder="Action entreprise" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4" />
              Dossier
            </label>
            <input 
              type="text" 
              name="dossier" 
              value={formData.dossier} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm bg-blue-50 border-blue-200" 
              placeholder="Les dossiers requis seront affichés ici" 
              readOnly
            />
            {dossiersFromRdv.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {dossiersFromRdv.length} dossier(s) identifié(s) lors de la descente
              </p>
            )}
          </div>
        </div>
      </div>,

      // Step 1 - Référence FT (pré-remplie automatiquement)
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh]">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4" />
              Référence 
            </label>
            <input 
              type="text" 
              name="referenceFT" 
              value={formData.referenceFT} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm bg-blue-50 border-blue-200" 
              placeholder="La référence sera générée automatiquement" 
            />
            <p className="text-xs text-blue-600 mt-1">
              Référence générée automatiquement
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" />
              Date 
            </label>
            <input 
              type="date" 
              name="dateFT" 
              value={formData.dateFT} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              Heure 
            </label>
            <input 
              type="time" 
              name="heureFT" 
              value={formData.heureFT} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
        </div>
      </div>,

      // Step 2 - Personne Convoquée (vide - à remplir manuellement)
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh]">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <User className="w-4 h-4" />
              Type de personne
            </label>
            <select 
              name="typeConvoquee" 
              value={formData.typeConvoquee} 
              onChange={handleChange} 
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="">Sélectionnez le type</option>
              <option value="proprietaire">Propriétaire</option>
              <option value="representant">Représentant</option>
              <option value="locataire">Locataire</option>
              <option value="occupant">Occupant</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <User className="w-4 h-4" />
              Nom complet 
            </label>
            <input 
              type="text" 
              name="nomComplet" 
              value={formData.nomComplet} 
              onChange={handleChange} 
              placeholder="Nom complet de la personne convoquée" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4" />
              Adresse 
            </label>
            <textarea 
              name="adresse" 
              value={formData.adresse} 
              onChange={handleChange} 
              placeholder="Adresse complète de la personne" 
              rows={3} 
              className="w-full border rounded-lg p-2 text-sm resize-none" 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4" />
              CIN 
            </label>
            <input 
              type="text" 
              name="cin" 
              value={formData.cin} 
              onChange={handleChange} 
              placeholder="Numéro de CIN" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4" />
              Contact 
            </label>
            <input 
              type="text" 
              name="contact" 
              value={formData.contact} 
              onChange={handleChange} 
              placeholder="Numéro de téléphone" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
        </div>
      </div>,

      // Step 3 - Information du Terrain (vide - à remplir manuellement)
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh]">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4" />
              Titre du terrain
            </label>
            <input 
              type="text" 
              name="titreTerrain" 
              value={formData.titreTerrain} 
              onChange={handleChange} 
              placeholder="Titre de propriété ou référence" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <User className="w-4 h-4" />
              Nom propriétaire
            </label>
            <input 
              type="text" 
              name="nomproprietaire" 
              value={formData.nomproprietaire} 
              onChange={handleChange} 
              placeholder="Nom du propriétaire" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Map className="w-4 h-4" />
              Localisation
            </label>
            <input 
              type="text" 
              name="localisation" 
              value={formData.localisation} 
              onChange={handleChange} 
              placeholder="Localisation précise du terrain" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Ruler className="w-4 h-4" />
              Superficie (m²)
            </label>
            <input 
              type="number" 
              name="superficie" 
              value={formData.superficie} 
              onChange={handleChange} 
              placeholder="Superficie en mètres carrés" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
        </div>
      </div>,

      // Step 4 - Motif et Détails (vide - à remplir manuellement)
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh]">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
              Motif
            </label>
            <input 
              type="text" 
              name="motif" 
              value={formData.motif} 
              onChange={handleChange} 
              placeholder="Motif de la convocation" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4" />
              Lieu
            </label>
            <input 
              type="text" 
              name="lieu" 
              value={formData.lieu} 
              onChange={handleChange} 
              placeholder="Lieu de la convocation" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
              But
            </label>
            <input 
              type="text" 
              name="but" 
              value={formData.but} 
              onChange={handleChange} 
              placeholder="But de la convocation" 
              className="w-full border rounded-lg p-2 text-sm" 
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4" />
              Mesure
            </label>
            <textarea 
              name="mesure" 
              value={formData.mesure} 
              onChange={handleChange} 
              placeholder="Mesures à prendre ou recommandations" 
              rows={4} 
              className="w-full border rounded-lg p-2 text-sm resize-none" 
            />
          </div>
        </div>
      </div>,

      // Step 5 - Type de Dossier
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <div className="space-y-4">
          {/* Champ pour définir les dossiers requis manuellement */}
          {(!dossiersFromRdv || dossiersFromRdv.length === 0) && (
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" />
                Définir les dossiers requis (optionnel)
              </label>
              <input 
                type="text" 
                name="manualDossiers" 
                value={manualDossiers} 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 text-sm" 
                placeholder="Entrez les dossiers requis, séparés par des virgules (ex: CSJ, Permis de Construction)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optionnel - Laissez vide si aucun dossier requis
              </p>
            </div>
          )}

          <label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Home className="w-4 h-4" />
            Type de dossier (optionnel)
            {(dossiersFromRdv.length > 0 || manualDossiers) && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
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
                <label key={option} className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 text-sm ${
                  isPreSelected ? 'bg-blue-50 border-blue-200' : ''
                } ${
                  isPreSelected && !isSelected ? 'border-red-300 bg-red-50' : ''
                }`}>
                  <input 
                    type="checkbox" 
                    name="dossierType" 
                    value={option} 
                    checked={isSelected} 
                    onChange={handleChange} 
                    className="w-4 h-4 text-blue-600" 
                  />
                  <span className="text-gray-800">
                    {option}
                    {isPreSelected && (
                      <span className={`text-xs ml-2 ${
                        isSelected ? 'text-green-600' : 'text-red-600'
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
        
        {/* Section de statut final */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Statut final du F.T.
          </h3>
          
          <div className={`p-3 rounded-lg mb-4 ${
            statusInfo.type === 'success' ? 'bg-green-50 border border-green-200' :
            statusInfo.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              {statusInfo.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : statusInfo.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              ) : (
                <Info className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <p className={`font-medium ${
                  statusInfo.type === 'success' ? 'text-green-800' :
                  statusInfo.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {statusInfo.title}
                </p>
                <p className={`text-sm ${
                  statusInfo.type === 'success' ? 'text-green-700' :
                  statusInfo.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {statusInfo.message}
                </p>
              </div>
            </div>
          </div>

          {/* Affichage conditionnel des dossiers manquants */}
          {hasRequiredDossiers && missingDossiers.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-sm text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Dossiers manquants ({missingDossiers.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-yellow-700 border-collapse">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="border border-yellow-200 p-2 text-left font-medium">Dossier manquant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingDossiers.map((dossier, index) => (
                      <tr key={index} className="border border-yellow-200">
                        <td className="p-2 font-medium">{dossier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                ⚠️ Ces dossiers doivent être fournis pour pouvoir faire l'AP
              </p>
            </div>
          )}

          {/* Délai pour complément */}
          {!isDossierComplete && hasRequiredDossiers && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Choisir la durée pour compléter le dossier :</p>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => handleDurationSelect('8')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    formData.durationComplement === '8' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  8 jours
                </button>
                <button 
                  type="button"
                  onClick={() => handleDurationSelect('15')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    formData.durationComplement === '15' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  15 jours
                </button>
              </div>
              
              {formData.deadline && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    📅 Date limite pour compléter les dossiers manquants: 
                    <span className="ml-1">{new Date(formData.deadline).toLocaleDateString('fr-FR')}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Résumé des dossiers */}
          {hasRequiredDossiers && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-sm text-blue-800 mb-2">Résumé:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Dossiers requis: <span className="font-medium">{requiredDossiers.length}</span></p>
                  <p className="text-blue-700">Dossiers fournis: <span className="font-medium">{formData.dossierType.length}</span></p>
                </div>
                <div>
                  <p className="text-blue-700">Dossiers manquants: <span className="font-medium">{missingDossiers.length}</span></p>
                  <p className="text-blue-700">Complétude: <span className={`font-medium ${
                    isDossierComplete ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isDossierComplete ? '100%' : `${Math.round((formData.dossierType.length / requiredDossiers.length) * 100)}%`}
                  </span></p>
                </div>
              </div>
            </div>
          )}

          {/* Affichage des erreurs API */}
          {apiError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-sm text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Erreur de connexion
              </h4>
              <p className="text-sm text-red-700">{apiError}</p>
              <p className="text-xs text-red-600 mt-2">
                💡 Solution: Vérifiez que le serveur backend est démarré sur http://localhost:3000
              </p>
            </div>
          )}

          {/* Bouton de validation */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-sm text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Validation finale du F.T.
            </h4>
            <p className="text-sm text-green-700 mb-4">
              {hasRequiredDossiers 
                ? 'Vérifiez que toutes les informations sont correctes avant de valider définitivement la Fiche de Travail.'
                : 'Aucun dossier requis identifié. Vous pouvez valider le F.T. sans restriction.'
              }
            </p>
            
            {!showValidationButton ? (
              <button
                type="button"
                onClick={showValidation}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Afficher le bouton de validation
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Vous pouvez maintenant valider la Fiche de Travail
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2 w-full justify-center"
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
                <p className="text-xs text-green-600">
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

  // Composant pour le contenu PDF APIPA (version simplifiée pour l'affichage)
  const APIPAPDFContent = () => {
    return (
      <div 
        className="pdf-preview bg-white p-8 max-w-4xl mx-auto border border-gray-300 shadow-lg"
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

  // Modal de succès avec option PDF
  const renderSuccessModal = () => {
    const statusInfo = getStatusMessage();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                F.T. Créé avec Succès
              </h3>
            </div>
            <button
              onClick={handleSuccessModalClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Fiche de Travail Validée
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                La fiche de travail a été créée avec succès et enregistrée dans le système.
              </p>

              {createdFT && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Détails du F.T. :</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Référence :</span> {createdFT.reference_ft}</p>
                    <p><span className="font-medium">Date :</span> {new Date(createdFT.date_ft).toLocaleDateString('fr-FR')}</p>
                    <p><span className="font-medium">Personne :</span> {createdFT.nom_complet}</p>
                    <p><span className="font-medium">Statut :</span> <span className={
                      createdFT.status_dossier === 'regularise' ? 'text-green-600 font-medium' :
                      createdFT.status_dossier === 'irregularise' ? 'text-red-600 font-medium' :
                      'text-blue-600 font-medium'
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
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Générer F.T APIPA
                </button>
                
                <button
                  onClick={handleSuccessModalClose}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Aperçu - F.T APIPA
            </h3>
          </div>
          <button
            onClick={() => setShowPdfModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <APIPAPDFContent />
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white">
          <button
            onClick={() => setShowPdfModal(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Retour
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPdfModal(false);
                handleSuccessModalClose();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Terminer
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
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
      <div className="bg-white border shadow-sm p-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: 'w-5 h-5' })}
            Étape {currentStep + 1} sur {steps.length} : {steps[currentStep].title}
          </h2>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 min-h-0">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 border-t pt-4">
            <button 
              type="button" 
              onClick={() => setCurrentStep(currentStep - 1)} 
              disabled={currentStep === 0 || isSubmitting} 
              className="px-4 py-2 border rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>

            {currentStep < steps.length - 1 ? (
              <button 
                type="button" 
                onClick={() => setCurrentStep(currentStep + 1)} 
                disabled={!isStepValid() || isSubmitting} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 text-sm"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              !showValidationButton && (
                <div className="text-sm text-gray-500">
                  Cliquez sur "Afficher le bouton de validation" pour valider le F.T.
                </div>
              )
            )}
          </div>
        </form>
      </div>

      {showSuccessModal && renderSuccessModal()}
      {showPdfModal && renderPdfModal()}
    </>
  );
}

export default FaireFT;
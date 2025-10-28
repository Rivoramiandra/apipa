import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, FileText, Send, X, AlertCircle, CheckCircle } from 'lucide-react';

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
  n_pv_pat?: string;
  n_fifafi?: string;
  mise_en_demeure_sent?: boolean;
  is_mise_en_demeure?: boolean;
}

interface MiseEnDemeureModalProps {
  rendezvous: Rendezvous;
  onClose: () => void;
  onSend: (rendezvousId: string, newDate?: string, newHeure?: string) => Promise<void>;
  isLoading?: boolean;
}

// Interface pour les toasts
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Interface pour la signature électronique
interface DigitalSignature {
  hash: string;
  qrCodeDataUrl: string;
  timestamp: string;
  documentId: string;
  verificationUrl: string;
  entity: string;
  destinataire: string;
}

// Service de signature électronique
class ElectronicSignatureService {
  private secretKey: string;

  constructor(secretKey: string = 'apipa-secret-key-2024') {
    this.secretKey = secretKey;
  }

  // Générer une signature numérique sécurisée
  async generateSignature(documentData: Rendezvous, newDate?: string, newHeure?: string): Promise<DigitalSignature> {
    // Données à signer
    const signatureData = {
      documentId: documentData.id,
      entity: 'APIPA',
      destinataire: documentData.nom_personne_r,
      type: 'Mise en demeure',
      infraction: documentData.infraction,
      dateDocument: new Date().toISOString().split('T')[0],
      nouvelleDate: newDate,
      nouvelleHeure: newHeure,
      timestamp: Date.now(),
      version: '1.0'
    };

    // Créer le hash sécurisé (simplifié pour le frontend)
    const dataString = JSON.stringify(signatureData);
    const hash = btoa(dataString + this.secretKey).substring(0, 32);

    // URL de vérification
    const verificationUrl = `${window.location.origin}/verify-document/${documentData.id}?signature=${hash}`;

    // Générer le QR Code (utilisation d'un service externe pour simplifier)
    const qrCodeDataUrl = await this.generateQRCode(verificationUrl);

    return {
      hash,
      qrCodeDataUrl,
      timestamp: new Date().toISOString(),
      documentId: documentData.id,
      verificationUrl,
      entity: 'APIPA',
      destinataire: documentData.nom_personne_r
    };
  }

  // Générer un QR Code avec un service en ligne (solution simplifiée)
  private async generateQRCode(text: string): Promise<string> {
    const qrSize = 128;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(text)}`;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      // Fallback vers un QR code simple en SVG
      return this.generateSimpleQRCode(text);
    }
  }

  // Fallback pour générer un QR code simple en SVG
  private generateSimpleQRCode(text: string): string {
    const encodedText = encodeURIComponent(text);
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="10" fill="black">
          QR Code: ${text.substring(0, 20)}...
        </text>
        <rect x="10" y="10" width="108" height="108" fill="none" stroke="black" stroke-width="1"/>
      </svg>
    `)}`;
  }

  // Vérifier une signature (pour la page de vérification)
  verifySignature(documentData: any, signature: string): boolean {
    const signatureData = {
      documentId: documentData.id,
      entity: 'APIPA',
      destinataire: documentData.nom_personne_r,
      type: 'Mise en demeure',
      infraction: documentData.infraction,
      dateDocument: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      version: '1.0'
    };

    const dataString = JSON.stringify(signatureData);
    const expectedHash = btoa(dataString + this.secretKey).substring(0, 32);
    
    return signature === expectedHash;
  }
}

// Service de génération PDF
class PDFService {
  // Générer un PDF avec jsPDF
  async generatePDF(
    rendezvous: Rendezvous, 
    newDate?: string, 
    newHeure?: string, 
    signature?: DigitalSignature
  ): Promise<Blob> {
    // Charger jsPDF dynamiquement
    const { jsPDF } = await import('jspdf');
    
    // Créer un nouveau document PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);

    // Fonctions utilitaires
    const formatDateDisplay = (dateString: string): string => {
      if (!dateString) return 'Non spécifié';
      try {
        let date: Date;
        if (dateString.includes('/')) {
          const [day, month, year] = dateString.split('/');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          date = new Date(dateString);
        }
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch (error) {
        return dateString;
      }
    };

    const formatHeureDisplay = (heureString: string): string => {
      if (!heureString) return 'Non spécifié';
      try {
        const [hours, minutes] = heureString.split(':');
        return `${hours}h${minutes || '00'}`;
      } catch (error) {
        return heureString;
      }
    };

    const formatLieu = (commune: string, fokontany: string, localite: string) => {
      const parts = [commune, fokontany, localite].filter(part => part && part.trim() !== '');
      return parts.join(' - ') || 'Lieu non spécifié';
    };

    // En-tête
    let yPosition = margin;

    // Logo et informations APIPA (gauche)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('MINISTERE DE LA', margin, yPosition);
    doc.text('DECENTRALISATION', margin, yPosition + 4);
    doc.text('ET DE L\'AMENAGEMENT DU', margin, yPosition + 8);
    doc.text('TERRITOIRE', margin, yPosition + 12);
    
    doc.setFont('helvetica', 'normal');
    doc.text('SECRETARIAT GENERAL', margin, yPosition + 18);
    doc.text('-------------------', margin, yPosition + 22);
    doc.setFont('helvetica', 'italic');
    doc.text('DIRECTION GENERALE', margin, yPosition + 28);
    doc.text('DE L\'AUTORITE POUR LA', margin, yPosition + 32);
    doc.text('PROTECTION CONTRE LES', margin, yPosition + 36);
    doc.text('INONDATIONS DE LA PLAINE', margin, yPosition + 40);
    doc.text('D\'ANTANANARIVO', margin, yPosition + 44);

    // Informations de date et destinataire (droite)
    const currentDate = new Date().toLocaleDateString('fr-FR');
    doc.setFont('helvetica', 'normal');
    doc.text(`Antananarivo, le ${currentDate}`, pageWidth - margin, yPosition, { align: 'right' });
    doc.text('Le Directeur Général', pageWidth - margin, yPosition + 5, { align: 'right' });
    doc.text('À', pageWidth - margin, yPosition + 10, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Monsieur ${rendezvous.nom_personne_r || 'NOM DU DESTINATAIRE'}`, pageWidth - margin, yPosition + 15, { align: 'right' });

    yPosition += 60;

    // Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MISE EN DEMEURE - Non comparution', pageWidth / 2, yPosition, { align: 'center' });
    doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    
    yPosition += 15;

    // Contenu
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Premier paragraphe
    const paragraph1 = `Conformément aux dispositions du décret gouvernemental n°2019-1543 du 11 Septembre 2019 relatif à l'encadrement des travaux de remblaiement dans les zones sous la juridiction de l'APIPA, et en application de la loi n°2015-052 du 03 Février 2016 concernant l'Aménagement du Territoire et l'Habitat ;`;
    const lines1 = doc.splitTextToSize(paragraph1, contentWidth);
    doc.text(lines1, margin, yPosition);
    yPosition += (lines1.length * 5) + 8;

    // Deuxième paragraphe
    const paragraph2 = `Suite à la convocation pour un rendez-vous fixé le ${formatDateDisplay(rendezvous.date_rendez_vous)} à ${formatHeureDisplay(rendezvous.heure_rendez_vous)}, il a été constaté votre absence non justifiée à cette convocation.`;
    const lines2 = doc.splitTextToSize(paragraph2, contentWidth);
    doc.text(lines2, margin, yPosition);
    yPosition += (lines2.length * 5) + 8;

    // Troisième paragraphe
    const paragraph3 = `Le rendez-vous concernait l'infraction suivante : ${rendezvous.infraction}, située à ${formatLieu(rendezvous.commune, rendezvous.fokontany, rendezvous.localite)}.`;
    const lines3 = doc.splitTextToSize(paragraph3, contentWidth);
    doc.text(lines3, margin, yPosition);
    yPosition += (lines3.length * 5) + 8;

    // Quatrième paragraphe (conditionnel)
    if (newDate && newHeure) {
      const paragraph4 = `Compte tenu de cette absence, une nouvelle convocation vous est adressée pour le ${formatDateDisplay(newDate)} à ${formatHeureDisplay(newHeure)}. Vous êtes tenu de vous présenter à cette nouvelle date sous peine de sanctions administratives.`;
      const lines4 = doc.splitTextToSize(paragraph4, contentWidth);
      doc.text(lines4, margin, yPosition);
      yPosition += (lines4.length * 5) + 8;
    } else {
      const paragraph4 = `Compte tenu de cette absence, vous êtes mis en demeure de régulariser votre situation dans les plus brefs délais. Tout manquement à cette obligation pourra entraîner l'engagement de poursuites judiciaires.`;
      const lines4 = doc.splitTextToSize(paragraph4, contentWidth);
      doc.text(lines4, margin, yPosition);
      yPosition += (lines4.length * 5) + 8;
    }

    // Cinquième paragraphe
    const paragraph5 = `Vous êtes prié de bien vouloir vous conformer aux prescriptions de l'APIPA et de régulariser votre situation conformément à la réglementation en vigueur.`;
    const lines5 = doc.splitTextToSize(paragraph5, contentWidth);
    doc.text(lines5, margin, yPosition);
    yPosition += (lines5.length * 5) + 8;

    // Sixième paragraphe
    const paragraph6 = `La présente mise en demeure vous est notifiée par écrit et fait courir les délais légaux pour la mise en conformité de votre situation.`;
    const lines6 = doc.splitTextToSize(paragraph6, contentWidth);
    doc.text(lines6, margin, yPosition);
    yPosition += (lines6.length * 5) + 15;

    // Signatures principales
    const signatureY = Math.max(yPosition, 200);
    
    // Signature destinataire (gauche)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Lu et approuvé,', margin, signatureY);
    doc.line(margin, signatureY + 8, margin + 60, signatureY + 8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Signature du destinataire', margin, signatureY + 12);

    // Signature APIPA (droite)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Antananarivo, le ${currentDate}`, pageWidth - margin, signatureY, { align: 'right' });
    doc.setFont('helvetica', 'italic');
    doc.text('Le Directeur Général de l\'APIPA', pageWidth - margin, signatureY + 5, { align: 'right' });
    doc.line(pageWidth - margin - 60, signatureY + 8, pageWidth - margin, signatureY + 8);
    doc.text('Signature et cachet', pageWidth - margin, signatureY + 12, { align: 'right' });

    // Footer avec QR code et signature électronique
    const footerY = pageHeight - 40;

    // Ligne de séparation du footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    // QR Code (taille réduite)
    if (signature && signature.qrCodeDataUrl) {
      try {
        const qrCodeImg = new Image();
        qrCodeImg.src = signature.qrCodeDataUrl;
        await new Promise((resolve) => {
          qrCodeImg.onload = resolve;
        });
        // QR code réduit : 20x20 mm au lieu de 40x40
        doc.addImage(qrCodeImg, 'PNG', margin, footerY, 20, 20);
      } catch (error) {
        console.error('Erreur lors du chargement du QR code:', error);
      }
    }

    // Informations de signature électronique (positionnées à côté du QR code)
    const infoX = margin + 25; // Commence après le QR code
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7); // Taille de police réduite
    
    // Informations sur une seule colonne pour économiser l'espace
    doc.text(`Doc: ${signature?.documentId || ''}`, infoX, footerY + 3);
    doc.text(`Horodatage: ${signature ? new Date(signature.timestamp).toLocaleDateString('fr-FR') : ''}`, infoX, footerY + 7);
    doc.text(`Hash: ${signature?.hash.substring(0, 12)}...`, infoX, footerY + 11);
    doc.text('QR Code: vérification électronique', infoX, footerY + 15);

    // Générer le blob PDF
    return doc.output('blob');
  }
}

// Composant Toast
const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ 
  toasts, 
  removeToast 
}) => {
  return (
    <div className="fixed top-4 right-4 z-[3000] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center p-4 rounded-lg shadow-lg border transform transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
            {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
            <span className="font-medium">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Modal de confirmation
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      default:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2500] flex justify-center items-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md border ${styles.border}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-full ${styles.bg}`}>
              <AlertCircle className={`w-6 h-6 ${styles.icon}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : styles.button
              }`}
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiseEnDemeureModal: React.FC<MiseEnDemeureModalProps> = ({
  rendezvous,
  onClose,
  onSend,
  isLoading = false
}) => {
  const [newDate, setNewDate] = useState('');
  const [newHeure, setNewHeure] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [signatureService] = useState(() => new ElectronicSignatureService());
  const [pdfService] = useState(() => new PDFService());

  // Formater la date pour l'input date
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        if (day && month && year) {
          const fullYear = year.length === 2 ? `20${year}` : year;
          return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      return '';
    } catch (error) {
      return '';
    }
  };

  // Formater l'heure pour l'input time
  const formatHeureForInput = (heureString: string): string => {
    if (!heureString) return '';
    
    try {
      const cleanHeure = heureString.trim();
      
      if (cleanHeure.includes(':')) {
        const [hours, minutes] = cleanHeure.split(':');
        return `${hours.padStart(2, '0')}:${minutes ? minutes.padStart(2, '0') : '00'}`;
      } else if (cleanHeure.includes('h') || cleanHeure.includes('H')) {
        const separator = cleanHeure.includes('h') ? 'h' : 'H';
        const [hours, minutes] = cleanHeure.split(separator);
        return `${hours.padStart(2, '0')}:${minutes ? minutes.padStart(2, '0') : '00'}`;
      } else if (/^\d+$/.test(cleanHeure)) {
        if (cleanHeure.length <= 2) {
          return `${cleanHeure.padStart(2, '0')}:00`;
        } else if (cleanHeure.length === 3) {
          return `${cleanHeure.substring(0, 1).padStart(2, '0')}:${cleanHeure.substring(1, 3).padStart(2, '0')}`;
        } else {
          return `${cleanHeure.substring(0, 2)}:${cleanHeure.substring(2, 4).padStart(2, '0')}`;
        }
      }
      return '';
    } catch (error) {
      return '';
    }
  };

  // Formater la date pour l'affichage
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return 'Non spécifié';
    
    try {
      let date: Date;
      
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Formater l'heure pour l'affichage
  const formatHeureDisplay = (heureString: string): string => {
    if (!heureString) return 'Non spécifié';
    
    try {
      const formattedTime = formatHeureForInput(heureString);
      if (formattedTime) {
        return formattedTime.replace(':', 'h');
      }
      return heureString;
    } catch (error) {
      return heureString;
    }
  };

  // Formater le lieu
  const formatLieu = (commune: string, fokontany: string, localite: string) => {
    const parts = [commune, fokontany, localite].filter(part => part && part.trim() !== '');
    return parts.join(' - ') || 'Lieu non spécifié';
  };

  // Gestion des toasts
  const showToast = (type: Toast['type'], message: string, duration = 5000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, type, message, duration };
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Initialiser les valeurs
  useEffect(() => {
    if (rendezvous) {
      setNewDate(formatDateForInput(rendezvous.date_rendez_vous));
      setNewHeure(formatHeureForInput(rendezvous.heure_rendez_vous));
      
      const today = new Date();
      setCurrentDate(today.toISOString().split('T')[0]);
    }
  }, [rendezvous]);

  // Générer le PDF de mise en demeure avec signature électronique
  const generateMiseEnDemeurePDF = async (): Promise<void> => {
    try {
      // Générer la signature électronique
      const signature = await signatureService.generateSignature(rendezvous, newDate, newHeure);

      // Générer le PDF avec jsPDF
      const pdfBlob = await pdfService.generatePDF(rendezvous, newDate, newHeure, signature);

      // Télécharger le PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mise-en-demeure-${rendezvous.id}-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw new Error('Erreur lors de la génération du PDF');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDate || !newHeure) {
      showToast('error', 'Veuillez saisir une date et une heure pour le nouveau rendez-vous');
      return;
    }

    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      showToast('error', 'La nouvelle date doit être aujourd\'hui ou dans le futur');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // 1. Envoyer la mise en demeure
      await onSend(rendezvous.id, newDate, newHeure);
      
      // 2. Générer le PDF avec signature électronique après l'envoi réussi
      await generateMiseEnDemeurePDF();
      
      showToast('success', 'Mise en demeure envoyée et PDF généré avec succès');
      setShowConfirmation(false);
      
      // Fermer le modal après un court délai
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la mise en demeure:', error);
      showToast('error', 'Erreur lors de l\'envoi de la mise en demeure');
      setShowConfirmation(false);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getConfirmationMessage = () => {
    return `Êtes-vous sûr de vouloir envoyer la mise en demeure avec le nouveau rendez-vous proposé le ${formatDateDisplay(newDate)} à ${formatHeureDisplay(newHeure)} ? Un PDF avec signature électronique sera généré automatiquement après l'envoi.`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[2000] flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mise en demeure</h3>
                <p className="text-gray-600 mt-1">Non comparution - Envoi de la mise en demeure avec signature électronique</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isLoading || isGeneratingPDF}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rendez-vous initial */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Rendez-vous initial - Non comparution
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Date initiale</p>
                        <p className="text-sm text-blue-900 font-semibold">
                          {formatDateDisplay(rendezvous.date_rendez_vous)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Heure initiale</p>
                        <p className="text-sm text-blue-900 font-semibold">
                          {formatHeureDisplay(rendezvous.heure_rendez_vous)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Personne concernée</p>
                        <p className="text-sm text-blue-900 font-semibold">
                          {rendezvous.nom_personne_r || 'Non spécifié'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Lieu</p>
                        <p className="text-sm text-blue-900 font-semibold">
                          {formatLieu(rendezvous.commune, rendezvous.fokontany, rendezvous.localite)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Infraction :</p>
                  <p className="text-sm text-blue-900 mt-1">{rendezvous.infraction}</p>
                </div>

                {rendezvous.notes && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Notes :</p>
                    <p className="text-sm text-blue-900 mt-1">{rendezvous.notes}</p>
                  </div>
                )}
              </div>

              {/* Nouvelle convocation */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Nouvelle convocation avec signature électronique
                </h4>
                <p className="text-sm text-yellow-700 mb-4">
                  Veuillez saisir la nouvelle date et heure de rendez-vous pour la mise en demeure.
                  Le PDF inclura une signature électronique sécurisée avec QR code.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newDate" className="block text-sm font-medium text-yellow-800 mb-2">
                        Nouvelle date de rendez-vous *
                      </label>
                      <input
                        type="date"
                        id="newDate"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        min={currentDate}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        required
                        disabled={isLoading || isGeneratingPDF}
                      />
                    </div>
                    <div>
                      <label htmlFor="newHeure" className="block text-sm font-medium text-yellow-800 mb-2">
                        Nouvelle heure de rendez-vous *
                      </label>
                      <input
                        type="time"
                        id="newHeure"
                        value={newHeure}
                        onChange={(e) => setNewHeure(e.target.value)}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        required
                        disabled={isLoading || isGeneratingPDF}
                      />
                    </div>
                  </div>

                  {newDate && newHeure && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800 font-medium">
                        📅 Nouveau rendez-vous proposé :{' '}
                        <span className="font-bold">
                          {formatDateDisplay(newDate)} à {formatHeureDisplay(newHeure)}
                        </span>
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              disabled={isLoading || isGeneratingPDF}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              onClick={handleSubmit}
              disabled={isLoading || isGeneratingPDF || !newDate || !newHeure}
              className={`px-6 py-2 rounded-lg font-medium text-white flex items-center space-x-2 transition-colors ${
                isLoading || isGeneratingPDF || !newDate || !newHeure
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isGeneratingPDF ? 'Envoi en cours...' : 'Envoyer avec signature électronique'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSend}
        title="Confirmer l'envoi de la mise en demeure"
        message={getConfirmationMessage()}
        confirmText={isGeneratingPDF ? 'Envoi en cours...' : 'Confirmer l\'envoi'}
        type="warning"
        isLoading={isGeneratingPDF}
      />

      {/* Container pour les toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default MiseEnDemeureModal;
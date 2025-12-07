import React, { useState, useEffect } from 'react';
import { FileCheck, X, Download, Upload, User, MapPin, Phone, Home, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

// Fonction pour formater les nombres avec espaces
export const formatNumber = (num: string | number): string => {
  if (!num) return '0';
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('fr-FR').format(numValue);
};

// Fonction pour convertir le montant en lettres
export const convertToLetters = (amount: number): string => {
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

// Composant PDF Modal
const PDFModal: React.FC<{
  formData: any;
  ftData: FTData;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}> = ({ formData, ftData, isOpen, onClose, onDownload }) => {
  if (!isOpen) return null;

  // Fonction pour générer le contenu HTML du PDF
  const getPDFContent = (): string => {
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const formattedDateAP = formData.date_faire_ap ? new Date(formData.date_faire_ap).toLocaleDateString('fr-FR') : currentDate;
    const dateDescente = formData.date_descente ? new Date(formData.date_descente).toLocaleDateString('fr-FR') : 'DATE DESCENTE';

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
            <div style="font-size: 11px; margin-bottom: 3px;">Antananarivo, le ${formattedDateAP}</div>
            <div style="font-size: 11px; margin-bottom: 3px;">Le Directeur Général</div>
            <div style="font-size: 11px; margin-bottom: 3px;">À</div>
            <div style="font-weight: bold; font-size: 11px;">Monsieur ${formData.nom_contrevenant || ftData.nom_complet}</div>
          </div>
        </div>
        
        <!-- Numéro d'avis -->
        <div style="text-align: center; margin: 25px 0; font-weight: bold; font-size: 14px;">
          Avis de Paiement n° <span style="text-decoration: underline;">${formData.numero_avis || 'REFERENCE'}</span>
        </div>        
        <!-- Corps du document -->
        <div style="text-align: justify;">
          <!-- Cadre légal -->
          <div style="margin-bottom: 15px;">
            <div>En application des dispositions du <span style="font-style: italic;">décret n°2019-1543 du 11 septembre 2019</span></div>
            <div>portant régulation de l'exécution des travaux de remblaiement dans les zones</div>
            <div>d'intervention de l'APIPA, en application de la <span style="font-style: italic;">loi n°2015-052 du 03 février 2016</span></div>
            <div>relative à l'Urbanisme et à l'Habitat ;</div>
          </div>
          
          <!-- Références -->
          <div style="margin-bottom: 15px;">
            <div>Vu le rapport de descente n°${formData.num_descente || 'NUM DESCENTE'} en date du ${dateDescente} effectué par l'équipe composée des Polices de l'Aménagement du Territoire/Brigade Spéciale ;</div>
            <div>Vu le certificat de situation juridique de la propriété dite ${formData.localite || 'LOCALITE'} sise à ${formData.localite || 'LOCALITE'} en date du ${currentDate} ;</div>
            <div>Vu le plan officiel ;</div>
          </div>
          
          <!-- Notification -->
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold;">Par la présente,</div>
            <div style="margin-top: 10px;">
              <div>Nous vous informons que le montant de</div>
              <div style="font-weight: bold; text-align: center; margin: 10px 0;">${formData.montant_lettres || 'MONTANT EN LETTRES'}</div>
              <div>(${formatNumber(formData.montant_total || 0)} Ar), dont les détails se trouvent au verso</div>
              <div>de ce document, est dû à l'Autorité pour la Protection contre les Inondations</div>
              <div>de la Plaine d'Antananarivo (APIPA) à titre d'amende relative aux travaux</div>
              <div>de remblai et/ou de déblai illicites effectués sur votre propriété</div>
              <div>correspondant aux coordonnées « X = ${formData.coord_x || ftData.coord_x} et Y = ${formData.coord_y || ftData.coord_y} »</div>
            </div>
          </div>
          
          <!-- Instructions de paiement -->
          <div style="margin-bottom: 15px;">
            <div>Vous êtes contraint de procéder au règlement de ce montant dans les</div>
            <div>${formData.delai_payment || '15'} jours à compter de la réception de la présente par le moyen</div>
            <div>d'un chèque de banque dûment légalisé par l'établissement bancaire auquel</div>
            <div>vous êtes affilié, et adressé à l'ordre de « Monsieur l'Agent Comptable de</div>
            <div>l'Autorité pour la Protection contre les Inondations de la Plaine</div>
            <div>d'Antananarivo (APIPA) ».</div>
          </div>
        </div>
        
        <!-- Signature -->
        <div style="margin-top: 40px; text-align: right;">
          <div style="font-weight: bold;">Le Directeur Général,</div>
        </div>

        <!-- Nouvelle page pour les informations détaillées -->
        <div style="page-break-before: always; margin-top: 30px;">
          <!-- Informations foncières -->
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">
              INFORMATIONS FONCIÈRES :
            </div>
            <div>Titre N°: ${formData.titre_foncier || ftData.titre_terrain || 'Non spécifié'}</div>
            <div>Coordonnées: X = ${formData.coord_x || ftData.coord_x || 'Non spécifié'}, Y = ${formData.coord_y || ftData.coord_y || 'Non spécifié'}</div>
            <div>Localisation: ${formData.localite || ftData.commune || 'Non spécifié'}</div>
          </div>
          
          <!-- Tableau de calcul -->
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">
              TABLEAU PORTANT REFERENCE DE CALCUL :
            </div>
            
            <!-- En-tête du tableau -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr 1fr; gap: 1px; background: #333; margin-bottom: 10px;">
              <div style="background: #002b55; color: white; padding: 5px; text-align: center; font-weight: bold;">N° Titre</div>
              <div style="background: #002b55; color: white; padding: 5px; text-align: center; font-weight: bold;">Destination</div>
              <div style="background: #002b55; color: white; padding: 5px; text-align: center; font-weight: bold;">Superficie</div>
              <div style="background: #002b55; color: white; padding: 5px; text-align: center; font-weight: bold;">Valeur de l'amende/redevance par unité</div>
              <div style="background: #002b55; color: white; padding: 5px; text-align: center; font-weight: bold;">Montant</div>
            </div>
            
            <!-- Données du tableau -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr 1fr; gap: 1px; background: #333;">
              <div style="background: white; padding: 8px; border: 1px solid #333;">${formData.titre_foncier || 'N/A'}</div>
              <div style="background: white; padding: 8px; border: 1px solid #333;">${formData.destination_terrain || 'HABITATION'}</div>
              <div style="background: white; padding: 8px; border: 1px solid #333;">${formatNumber(formData.superficie_terrain || 0)} m²</div>
              <div style="background: white; padding: 8px; border: 1px solid #333;">${formatNumber(formData.valeur_unitaire || 0)} Ar</div>
              <div style="background: white; padding: 8px; border: 1px solid #333;">${formatNumber(formData.montant_total || 0)} Ar</div>
            </div>
          </div>
          
          <!-- Récapitulatif -->
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold;">
              Le montant total à payer s'élève à ${formData.montant_lettres || 'MONTANT EN LETTRES'}.
            </div>
          </div>
          
          <!-- Signature finale -->
          <div style="margin-top: 40px; text-align: right;">
            <div>Antananarivo, le ${formattedDateAP}</div>
            <div style="font-weight: bold; margin-top: 20px;">Le Directeur Général,</div>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <FileCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Aperçu - Avis de Paiement APIPA
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div 
            className="pdf-preview bg-white p-8 mx-auto border border-gray-300 shadow-lg"
            style={{ 
              fontFamily: 'Times New Roman, serif',
              fontSize: '12px',
              lineHeight: '1.4',
              color: '#000',
              background: 'white',
              maxWidth: '210mm',
              minHeight: '297mm'
            }}
            dangerouslySetInnerHTML={{ __html: getPDFContent() }}
          />
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Retour
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Terminer
            </button>
            <button
              onClick={onDownload}
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
};

// Fonction pour générer le PDF
export const generateAPIPAPDF = (formData: any, ftData: FTData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Configuration
  const margin = 15;
  let yPosition = margin;
  const lineHeight = 7;
  const sectionSpacing = 10;

  // Couleurs
  const primaryColor = [0, 51, 102]; // Bleu foncé
  const secondaryColor = [102, 102, 102]; // Gris

  // En-tête avec tableau
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F');
  
  // Texte en-tête en blanc
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Colonne gauche - Ministère
  doc.text('MINISTERE DE LA', margin + 5, yPosition + 10);
  doc.text('DECENTRALISATION', margin + 5, yPosition + 15);
  doc.text('ET DE L\'AMENAGEMENT DU', margin + 5, yPosition + 20);
  doc.text('TERRITOIRE', margin + 5, yPosition + 25);
  doc.text('------------------------', margin + 5, yPosition + 30);
  doc.text('SECRETARIAT GENERAL', margin + 5, yPosition + 35);
  doc.text('------------------------', margin + 5, yPosition + 40);
  
  // Colonne milieu - Direction
  doc.setFontSize(8);
  doc.text('DIRECTION GENERALE', pageWidth / 2 - 20, yPosition + 10);
  doc.text('DE L\'AUTORITE POUR LA', pageWidth / 2 - 20, yPosition + 15);
  doc.text('PROTECTION', pageWidth / 2 - 20, yPosition + 20);
  doc.text('CONTRE LES INONDATIONS', pageWidth / 2 - 20, yPosition + 25);
  doc.text('DE LA PLAINE', pageWidth / 2 - 20, yPosition + 30);
  doc.text('D\'ANTANANARIVO', pageWidth / 2 - 20, yPosition + 35);
  doc.text('------------------------', pageWidth / 2 - 20, yPosition + 40);

  // Colonne droite - Destinataire
  doc.setFontSize(10);
  const rightColX = pageWidth - margin - 60;
  doc.text('Antananarivo, le', rightColX, yPosition + 10);
  doc.text(format(new Date(formData.date_faire_ap), 'dd/MM/yyyy', { locale: fr }), rightColX, yPosition + 15);
  doc.text('Le Directeur Général', rightColX, yPosition + 25);
  doc.text('À', rightColX, yPosition + 32);
  doc.setFontSize(12);
  doc.text(`Monsieur ${formData.nom_contrevenant || ftData.nom_complet}`, rightColX, yPosition + 40);

  yPosition += 50;

  // Numéro d'avis
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Avis de Paiement n°${formData.numero_avis}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += sectionSpacing;

  // Cadre légal
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const legalText = [
    "En application des dispositions du décret n°2019-1543 du 11 septembre 2019",
    "portant régulation de l'exécution des travaux de remblaiement dans les zones",
    "d'intervention de l'APIPA, en application de la loi n°2015-052 du 03 février 2016",
    "relative à l'Urbanisme et à l'Habitat ;"
  ];
  
  legalText.forEach(line => {
    doc.text(line, margin, yPosition);
    yPosition += lineHeight;
  });

  yPosition += 5;

  // Références
  const references = [
    `Vu le rapport de descente n°${formData.num_descente} en date du ${format(new Date(formData.date_descente), 'dd/MM/yyyy', { locale: fr })} effectué par l'équipe composée des Polices de l'Aménagement du Territoire/Brigade Spéciale ;`,
    `Vu le certificat de situation juridique de la propriété dite ${formData.localite} sise à ${formData.localite} en date du ${format(new Date(), 'dd/MM/yyyy', { locale: fr })} ;`,
    "Vu le plan officiel ;"
  ];

  references.forEach(ref => {
    doc.text(ref, margin, yPosition);
    yPosition += lineHeight;
  });

  yPosition += 10;

  // Corps du texte
  doc.setFont('helvetica', 'bold');
  doc.text('Par la présente,', margin, yPosition);
  yPosition += lineHeight + 5;

  const montantEnLettres = formData.montant_lettres || convertToLetters(parseFloat(formData.montant_total) || 0);
  
  doc.setFont('helvetica', 'normal');
  const notificationText = [
    "Nous vous informons que le montant de",
    `${montantEnLettres}`,
    `(${formatNumber(formData.montant_total)} Ar), dont les détails se trouvent au verso`,
    "de ce document, est dû à l'Autorité pour la Protection contre les Inondations",
    "de la Plaine d'Antananarivo (APIPA) à titre d'amende relative aux travaux",
    "de remblai et/ou de déblai illicites effectués sur votre propriété",
    `correspondant aux coordonnées « X = ${formData.coord_x || ftData.coord_x} et Y = ${formData.coord_y || ftData.coord_y} »`
  ];

  notificationText.forEach((line, index) => {
    if (index === 1) {
      doc.setFont('helvetica', 'bold');
      doc.text(line, margin, yPosition);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.text(line, margin, yPosition);
    }
    yPosition += lineHeight;
  });

  yPosition += 10;

  // Instructions de paiement
  const paymentInstructions = [
    "Vous êtes contraint de procéder au règlement de ce montant dans les",
    `${formData.delai_payment} jours à compter de la réception de la présente par le moyen`,
    "d'un chèque de banque dûment légalisé par l'établissement bancaire auquel",
    "vous êtes affilié, et adressé à l'ordre de « Monsieur l'Agent Comptable de",
    "l'Autorité pour la Protection contre les Inondations de la Plaine",
    "d'Antananarivo (APIPA) »."
  ];

  paymentInstructions.forEach(line => {
    doc.text(line, margin, yPosition);
    yPosition += lineHeight;
  });

  yPosition += 15;

  // Signature
  doc.text('Le Directeur Général,', pageWidth - margin - 50, yPosition, { align: 'right' });

  // Nouvelle page pour les informations détaillées
  doc.addPage();
  yPosition = margin;

  // Titre informations foncières
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('INFORMATIONS FONCIÈRES :', margin, yPosition);
  yPosition += sectionSpacing;

  // Informations foncières
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const landInfo = [
    `Titre N°: ${formData.titre_foncier || ftData.titre_terrain || 'Non spécifié'}`,
    `Coordonnées: X = ${formData.coord_x || ftData.coord_x || 'Non spécifié'}, Y = ${formData.coord_y || ftData.coord_y || 'Non spécifié'}`,
    `Localisation: ${formData.localite || ftData.commune || 'Non spécifié'}`
  ];

  landInfo.forEach(info => {
    doc.text(info, margin, yPosition);
    yPosition += lineHeight;
  });

  yPosition += 10;

  // Tableau de calcul
  doc.setFont('helvetica', 'bold');
  doc.text('TABLEAU PORTANT REFERENCE DE CALCUL :', margin, yPosition);
  yPosition += sectionSpacing;

  // En-têtes du tableau
  const tableHeaders = ['N° Titre', 'Destination', 'Superficie', 'Valeur de l\'amende/redevance par unité', 'Montant'];
  const columnWidths = [30, 35, 25, 50, 30];
  let xPosition = margin;

  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  tableHeaders.forEach((header, index) => {
    doc.text(header, xPosition + 2, yPosition + 6);
    xPosition += columnWidths[index];
  });

  yPosition += 10;
  xPosition = margin;

  // Données du tableau
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const tableData = [
    formData.titre_foncier || ftData.titre_terrain || 'N/A',
    formData.destination_terrain || 'HABITATION',
    `${formatNumber(formData.superficie_terrain)} m²`,
    `${formatNumber(formData.valeur_unitaire)} Ar`,
    `${formatNumber(formData.montant_total)} Ar`
  ];

  // Ligne de données
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 8);
  tableData.forEach((data, index) => {
    doc.text(data.toString(), xPosition + 2, yPosition + 5);
    xPosition += columnWidths[index];
  });

  yPosition += 15;

  // Récapitulatif du montant
  doc.setFont('helvetica', 'bold');
  doc.text(`Le montant total à payer s'élève à ${montantEnLettres}.`, margin, yPosition);

  yPosition += 20;

  // Date et signature
  doc.text('Antananarivo, le', pageWidth - margin - 50, yPosition, { align: 'right' });
  doc.text(format(new Date(formData.date_faire_ap), 'dd/MM/yyyy', { locale: fr }), pageWidth - margin - 50, yPosition + 6, { align: 'right' });
  doc.text('Le Directeur Général,', pageWidth - margin - 50, yPosition + 15, { align: 'right' });

  return doc;
};

// Composant principal
const FaireAPComponent: React.FC<{
  ft: FTData;
  onClose: () => void;
  onUpdate: (paymentData: Partial<PaymentData>) => void;
}> = ({ ft, onClose, onUpdate }) => {
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
  const [existingAP, setExistingAP] = useState<any>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Fonction pour télécharger le PDF
  const handleDownloadPDF = () => {
    const pdfDoc = generateAPIPAPDF(formData, ft);
    pdfDoc.save(`Avis_Paiement_APIPA_${formData.numero_avis}.pdf`);
  };

  // Fonction pour afficher le modal PDF
  const handleShowPDF = () => {
    setShowPdfModal(true);
  };

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
      date_faire_ap: existingAP?.date_ap || new Date().toISOString().split('T')[0],
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
      statut: existingAP?.statut || 'en attente de paiement'
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
const response = await fetch(`http://localhost:3000/api/ft/${ft.id}/ap`, {
  method: 'PUT',
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

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 p-4 transition-opacity">
        <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-[60vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-white z-10 rounded-t-xl flex-shrink-0">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <FileCheck className="w-6 h-6 text-green-600" />
                <span>
                  {existingAP ? 'Mettre à jour l\'Avis de Paiement' : 'Compléter l\'Avis de Paiement'}
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
                        readOnly={!!existingAP}
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
                        readOnly={!!existingAP}
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
            <div className="p-6 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={handleShowPDF}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Visualiser PDF</span>
                </button>
                <button 
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger PDF</span>
                </button>
              </div>
              
              <div className="flex space-x-3">
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
                    existingAP ? 'Mettre à jour l\'AP' : 'Compléter l\'AP'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal PDF */}
      <PDFModal
        formData={formData}
        ftData={ft}
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        onDownload={handleDownloadPDF}
      />
    </>
  );
};

export default FaireAPComponent;
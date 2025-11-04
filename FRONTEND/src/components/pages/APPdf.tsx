import React from 'react';
import { Download } from 'lucide-react';
import { generateAPIPAPDF } from './FaireAPComponent';
import { FTData } from './FaireAPComponent';

interface PDFGeneratorProps {
  formData: any;
  ftData: FTData;
  className?: string;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ 
  formData, 
  ftData, 
  className = '' 
}) => {
  const handleDownloadPDF = () => {
    if (!formData.numero_avis) {
      alert('Veuillez d\'abord compléter les informations de l\'avis de paiement');
      return;
    }

    try {
      const pdfDoc = generateAPIPAPDF(formData, ftData);
      pdfDoc.save(`Avis_Paiement_APIPA_${formData.numero_avis}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  return (
    <button 
      type="button"
      onClick={handleDownloadPDF}
      className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>Générer PDF</span>
    </button>
  );
};

export default PDFGenerator;
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Définition des types TypeScript
interface FormData {
  numeroAvis: string;
  annee: string;
  nomDestinataire: string;
  dateDocument: string;
  titreFoncier: string;
  coordonneeX: string;
  coordonneeY: string;
  localisation: string;
  superficie: string;
  valeurAmende: string;
  montantTotal: string;
  montantEnLettres: string;
}

const APIPAPDFGenerator: React.FC = () => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>({
    numeroAvis: '039',
    annee: '2025',
    nomDestinataire: 'JIMMY Michaël',
    dateDocument: new Date().toLocaleDateString('fr-FR'),
    titreFoncier: '18.488 BAV',
    coordonneeX: '519888',
    coordonneeY: '796060',
    localisation: 'Ankazobe',
    superficie: '3 429',
    valeurAmende: '12 500',
    montantTotal: '42 862 500',
    montantEnLettres: 'QUARANTE-DEUX MILLIONS HUIT CENT SOIXANTE-DEUX MILLE CINQ CENTS ARIARY'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadPDF = async (): Promise<void> => {
    const input = pdfRef.current;
    if (!input) {
      console.error('Element PDF non trouvé');
      return;
    }

    try {
      console.log('Début de la génération du PDF...');

      // Forcer le re-rendu et attendre que le contenu soit stable
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        width: input.scrollWidth,
        height: input.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight
      });

      console.log('Canvas généré:', canvas.width, 'x', canvas.height);

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas vide - dimensions nulles');
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      console.log('Dimensions PDF:', imgWidth, 'x', imgHeight);

      // Ajouter l'image au PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Sauvegarder le PDF
      pdf.save(`Avis_Paiement_APIPA_${formData.numeroAvis}_${formData.annee}.pdf`);
      
      console.log('PDF généré avec succès');

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Voir la console pour plus de détails.');
    }
  };

  // Logo en base64 (remplacez par votre vrai logo)
  const logoBase64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMDA0Mjk5Ii8+Cjx0ZXh0IHg9IjUwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+QVBLQTwvdGV4dD4KPC9zdmc+";

  return (
    <div className="container">
      <h1>Générateur d'Avis de Paiement APIPA</h1>
      
      <div className="form-container">
        <h2>Informations du document</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Numéro d'avis:</label>
            <input 
              type="text" 
              name="numeroAvis" 
              value={formData.numeroAvis}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Année:</label>
            <input 
              type="text" 
              name="annee" 
              value={formData.annee}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Nom du destinataire:</label>
            <input 
              type="text" 
              name="nomDestinataire" 
              value={formData.nomDestinataire}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Date du document:</label>
            <input 
              type="text" 
              name="dateDocument" 
              value={formData.dateDocument}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Titre foncier:</label>
            <input 
              type="text" 
              name="titreFoncier" 
              value={formData.titreFoncier}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Coordonnée X:</label>
            <input 
              type="text" 
              name="coordonneeX" 
              value={formData.coordonneeX}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Coordonnée Y:</label>
            <input 
              type="text" 
              name="coordonneeY" 
              value={formData.coordonneeY}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Localisation:</label>
            <input 
              type="text" 
              name="localisation" 
              value={formData.localisation}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Superficie (m²):</label>
            <input 
              type="text" 
              name="superficie" 
              value={formData.superficie}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Valeur de l'amende (Ar):</label>
            <input 
              type="text" 
              name="valeurAmende" 
              value={formData.valeurAmende}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Montant total (Ar):</label>
            <input 
              type="text" 
              name="montantTotal" 
              value={formData.montantTotal}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group full-width">
            <label>Montant en lettres:</label>
            <textarea 
              name="montantEnLettres" 
              value={formData.montantEnLettres}
              onChange={handleInputChange}
              rows={2}
            />
          </div>
        </div>
        
        <button className="generate-btn" onClick={downloadPDF}>
          Générer le PDF
        </button>
      </div>

      {/* Conteneur PDF avec styles fixes */}
      <div 
        ref={pdfRef}
        className="pdf-preview"
        style={{
          position: 'relative',
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: 'white',
          padding: '20mm',
          boxSizing: 'border-box',
          margin: '20px auto',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          fontFamily: 'Times New Roman, serif',
          fontSize: '12px',
          lineHeight: '1.4'
        }}
      >
        <div className="document">
          {/* En-tête avec les trois colonnes */}
          <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div className="column left-column" style={{ textAlign: 'center', flex: 1 }}>
              <div>MINISTERE DE LA</div>
              <div>DECENTRALISATION</div>
              <div>ET DE L'AMENAGEMENT DU</div>
              <div>TERRITOIRE</div>
              <div className="separator" style={{ margin: '5px 0' }}>-------------------</div>
              <div>SECRETARIAT GENERAL</div>
              <div className="separator" style={{ margin: '5px 0' }}>-------------------</div>
              <div style={{ fontStyle: 'italic' }}>DIRECTION GENERALE</div>
              <div style={{ fontStyle: 'italic' }}>DE L'AUTORITE POUR LA</div>
              <div style={{ fontStyle: 'italic' }}>PROTECTION</div>
              <div style={{ fontStyle: 'italic' }}>CONTRE LES INONDATIONS</div>
              <div style={{ fontStyle: 'italic' }}>DE LA PLAINE</div>
              <div style={{ fontStyle: 'italic' }}>D'ANTANANARIVO</div>
              <div className="separator" style={{ margin: '5px 0' }}>-------------------</div>
            </div>
            
            <div className="column middle-column" style={{ flex: 1 }}>
              {/* Colonne vide */}
            </div>
            
            <div className="column right-column" style={{ textAlign: 'right', flex: 1 }}>
              <div>Antananarivo, le {formData.dateDocument}</div>
              <div>Le Directeur Général</div>
              <div>À</div>
              <div style={{ fontWeight: 'bold' }}>Monsieur {formData.nomDestinataire}</div>
            </div>
          </div>
          
          {/* Numéro d'avis */}
          <div className="avis-number" style={{ textAlign: 'center', margin: '20px 0', fontWeight: 'bold' }}>
            Avis de Paiement n°<span style={{ textDecoration: 'underline' }}>{formData.numeroAvis}</span>/{formData.annee}
          </div>
          
          {/* Logo */}
          <div className="logo-container" style={{ textAlign: 'center', margin: '10px 0' }}>
            <img src={logoBase64} alt="Logo APIPA" style={{ width: '90px', height: '55px' }} />
          </div>
          
          {/* Corps du document */}
          <div className="content" style={{ margin: '20px 0' }}>
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              En application des dispositions du <span style={{ fontStyle: 'italic' }}>décret n°2019-1543 du 11 septembre 2019 portant régulation de l'exécution des travaux de remblaiement dans les zones d'intervention de l'APIPA, en application de la loi n°2015-052 du 03 février 2016 relative à l'Urbanisme et à l'Habitat</span>;
            </div>
            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Vu le rapport de descente n°015/25 en date du 21/02/2025 effectué par l'équipe composée des Polices de l'Aménagement du Territoire/Brigade Spéciale;
            </div>
            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Vu le certificat de situation juridique de la propriété dite MANDROSOBE I sise à Ankazobe en date du 08/10/2024;
            </div>
            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Vu le plan officiel;
            </div>
            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Par la présente,
            </div>
            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Nous vous informons que le montant de <span style={{ fontWeight: 'bold' }}>{formData.montantEnLettres}</span> (<span style={{ fontWeight: 'bold' }}>{formData.montantTotal} Ar</span>), dont les détails se trouvent au verso de ce document, est dû à l'Autorité pour la Protection contre les Inondations de la Plaine d'Antananarivo (APIPA) à titre <span style={{ textDecoration: 'underline' }}>d'amande</span> relative aux travaux de remblai et/ou de déblai illicites effectués sur votre propriété correspondant aux coordonnées « X = {formData.coordonneeX} et Y = {formData.coordonneeY} »
            </div>
            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Vous êtes contraint de procéder au règlement de ce montant dans les quinzaines (15 jours) à compter de la réception de la présente par le moyen <span style={{ fontStyle: 'italic' }}>d'un chèque de banque dûment légalisé par l'établissement bancaire auquel vous êtes affilié, et adressé à l'ordre de « Monsieur l'Agent Comptable de l'Autorité pour la Protection contre les Inondations de la Plaine d'Antananarivo (APIPA) »</span>.
            </div>
          </div>
          
          {/* Signature */}
          <div className="signature-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            <div className="signature-left" style={{ flex: 1 }}></div>
            <div className="signature-middle" style={{ flex: 1 }}></div>
            <div className="signature-right" style={{ textAlign: 'right', flex: 1 }}>
              <div style={{ fontStyle: 'italic' }}>Le Directeur Général,</div>
            </div>
          </div>
          
          
          
          {/* Signature finale */}
          <div className="final-signature" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            <div className="signature-left" style={{ flex: 1 }}></div>
            <div className="signature-middle" style={{ flex: 1 }}></div>
            <div className="signature-right" style={{ textAlign: 'right', flex: 1 }}>
              <div>Antananarivo, le {formData.dateDocument}</div>
              <div style={{ fontStyle: 'italic' }}>Le Directeur Général,</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }
        
        .form-container {
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        label {
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        input, textarea {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .generate-btn {
          background-color: #2c3e50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          display: block;
          margin: 0 auto;
        }
        
        .generate-btn:hover {
          background-color: #1a252f;
        }
      `}</style>
    </div>
  );
};

export default APIPAPDFGenerator;
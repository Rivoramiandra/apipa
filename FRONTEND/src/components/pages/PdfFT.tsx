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
      <h1>Générateur F.T APIPA</h1>
      
      <div className="form-container">
        <h2>Informations du document</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Numéro FT:</label>
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
            Fitanana an-Tsporatra n°<span style={{ textDecoration: 'underline' }}>{formData.numeroAvis}</span>/{formData.annee}
          </div>
          
          {/* Logo */}
          <div className="logo-container" style={{ textAlign: 'center', margin: '10px 0' }}>
            <img src={logoBase64} alt="Logo APIPA" style={{ width: '90px', height: '55px' }} />
          </div>
          
          {/* Corps du document */}
          <div className="content" style={{ margin: '20px 0' }}>
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
                Araka ny fepetra voalazan’ny <span style={{ fontStyle: 'italic' }}>didim-panjakana laharana f°2019-1543 tamin’ny 11 Septambra 2019 mikasika ny fandrindrana ny fanatanterahana ny asa famenoana tany (remblaiement) eny amin’ireo faritra iasan’ny APIPA, sy araka ny lalàna laharana f°2015-052 tamin’ny 03 Febroary 2016 momba ny Fanajariana ny Tany sy ny Fonenana (Urbanisme et Habitat)</span>;
            </div>

            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Taorian'ny torolalana azo avy amin'Andriamatoa Tale Jeneralin'ny APIPA. <br />Nisy ny fidinana ifotony nataon'ny ekipa avy ato amin'ny APIPA,ny faha(date descente),tamin'ny (heure descente),tao (commune,fokotany,localisation),momba ny tany (titreterrain) an'i (nom proprietaire),faringotra (x_coord ;y_coord) ary velarana (superficie)
              <br />Marihina fa nahitana (infraction) tao amin'io tany io,ary nandraisana fepetra avy hatrany toy izao (action). <br />Tonga eto amin'ny biraon'ny APIPA androany faha (Dateft),tamin'ny(heureft) ny (typepersone),A/toa,R/toa (nompersonne),tompon'ny karapanondrom-pirenena laharana (CIN),ary laharana finday ahazahoana azy (contact).
            </div>
            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
                 Nitondra ireto antotan-taratasy manaraka ireto:
                 <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
                    <li>— ....................................................</li>
                    <li>— ....................................................</li>
                    <li>— ....................................................</li>
                    <li>— ....................................................</li>
                </ul>
            </div>
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
             Antotan-taratasy ambiny :
                <ul style={{ marginLeft: '25px', marginBottom: '10px' }}>
                    <li>— ....................................................</li>
                    <li>— ....................................................</li>
                    <li>— ....................................................</li>
                    <li>— ....................................................</li>
                </ul>
                <div style={{ fontWeight: 'bold', marginTop: '10px' }}>
                    Daty farany fanaterana: <span style={{ textDecoration: 'underline' }}>..............................</span>
                </div>
            </div>
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Fepetra nampitan'ny APIPA: <br />
              <p>liste fepetra</p>
            </div>
            
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Marihina fa fepetra tsy maintsy hajaina ireo ampitaina aminy ireo, ary ny tsy fanajana ireo na amin'ny ampahany aza dia azo raisina ho fandikan-dalana ary ahafahan'ny Fanjakana manokatra ny dingan-tsazy.
            </div> 
            <div className="paragraph" style={{ marginBottom: '15px', textAlign: 'justify' }}>
              Ho fanamafisana izany rehetra izay rehetra voarakitra an-tsoratra sy ny fanatanterahana ireo fepetra takian'ny APIPA dia manao sonia eto ambany
            </div>
          </div>
          
          {/* Signature */}
          <div className="signature-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            <div className="signature-left" style={{ flex: 1 }}>
              <div style={{ fontStyle: 'italic' }}>Le Directeur Général,</div>
            </div>
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
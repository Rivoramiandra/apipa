import React, { useState } from 'react';
import { User, MapPin, Home, Calendar, FileText, DollarSign, Building, Tag, CheckCircle, AlertCircle, X, Plus } from 'lucide-react';

// Définir les types pour les données du formulaire
interface PcPermisDeConstruire {
  demandeur: string;
  proprietaire: string;
  annee: number | null;
  adresse: string;
  localisation: string;
  commune: string;
  dateArriveeAPIPA: string;
  dateCommissionAPIPA: string;
  dateDefinitive: string;
  categorie: 'regulier' | 'irregulier' | 'autre';
  situationPC: 'non traite' | 'traite';
  surface: number | null;
  superficieDemande: number | null;
  immatriculationTerrain: string;
  prescriptionUrbanisme: string;
  typeZone: string;
  sousTypeZone: string;
  reference: string;
  serviceEnvoyeur: string;
  avisDePaiement: string;
  montantRedevance: number | null;
  situationRedevance: string;
  avisCommissionDescente: string;
  observationCommission: string;
}

// Options pour les zones constructibles
const zonesConstructibles = [
  'cimitiere',
  'corridor commercial',
  'site de decharge et centre d\'enfoissement',
  'voirie existante',
  'zone commerciale',
  'zone commerciale primaire',
  'zone d\'equipement publique et administratif',
  'zone de developpement mixte',
  'zone industrielle',
  'zone militaire',
  'zone residentielle a faible densite',
  'zone residentielle a forte densite',
  'zone residentielle a tres faible densite',
  'zone residentielle a tres forte densite',
  'zone residentielle a moyenne densite'
];

// Options pour les zones non constructibles
const zonesNonConstructibles = [
  'espace vert et park',
  'pente rapide',
  'perimetre de protection',
  'plan d\'eau',
  'zone a PUDe',
  'zone boisee',
  'zone de developpement soumise a un plan d\'amenagement',
  'zone humide'
];

const FormulairePC: React.FC = () => {
  const [formData, setFormData] = useState<PcPermisDeConstruire>({
    demandeur: '',
    proprietaire: '',
    annee: null,
    adresse: '',
    localisation: '',
    commune: '',
    dateArriveeAPIPA: '',
    dateCommissionAPIPA: '',
    dateDefinitive: '',
    categorie: 'regulier',
    situationPC: 'non traite',
    surface: null,
    superficieDemande: null,
    immatriculationTerrain: '',
    prescriptionUrbanisme: '',
    typeZone: '',
    sousTypeZone: '',
    reference: '',
    serviceEnvoyeur: '',
    avisDePaiement: '',
    montantRedevance: null,
    situationRedevance: '',
    avisCommissionDescente: '',
    observationCommission: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [zoneConstructible, setZoneConstructible] = useState<boolean | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (['annee', 'surface', 'superficieDemande', 'montantRedevance'].includes(name)) {
      setFormData(prevData => ({
        ...prevData,
        [name]: value ? parseFloat(value) : null,
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
      }));

      // Réinitialiser le sous-type si le type de zone change
      if (name === 'prescriptionUrbanisme') {
        setFormData(prevData => ({
          ...prevData,
          sousTypeZone: ''
        }));
      }
    }
  };

  const handleZoneTypeChange = (isConstructible: boolean) => {
    setZoneConstructible(isConstructible);
    setFormData(prevData => ({
      ...prevData,
      prescriptionUrbanisme: isConstructible ? 'constructible' : 'non_constructible',
      sousTypeZone: ''
    }));
  };

  const handleSousTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prevData => ({
      ...prevData,
      sousTypeZone: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation de la prescription urbanisme
    if (!formData.prescriptionUrbanisme) {
      alert('Veuillez sélectionner le type de zone (constructible/non constructible)');
      return;
    }

    if (!formData.sousTypeZone) {
      alert('Veuillez sélectionner le sous-type de zone');
      return;
    }

    console.log('Formulaire soumis:', formData);
    // Ici, vous pouvez appeler votre API pour envoyer les données
    alert('Demande de permis de construire enregistrée avec succès!');
    setShowForm(false);
    
    // Réinitialiser le formulaire
    setFormData({
      demandeur: '',
      proprietaire: '',
      annee: null,
      adresse: '',
      localisation: '',
      commune: '',
      dateArriveeAPIPA: '',
      dateCommissionAPIPA: '',
      dateDefinitive: '',
      categorie: 'regulier',
      situationPC: 'non traite',
      surface: null,
      superficieDemande: null,
      immatriculationTerrain: '',
      prescriptionUrbanisme: '',
      typeZone: '',
      sousTypeZone: '',
      reference: '',
      serviceEnvoyeur: '',
      avisDePaiement: '',
      montantRedevance: null,
      situationRedevance: '',
      avisCommissionDescente: '',
      observationCommission: '',
    });
    setZoneConstructible(null);
  };

  // Style commun pour tous les inputs et selects
  const inputStyle = "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Permis de Construire</h1>
          <p className="text-slate-600 mt-1">Gestion des demandes de permis de construire</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle demande</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Total demandes</p>
              <p className="text-2xl font-bold text-slate-800">0</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">0</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Traités</p>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Nouvelle Demande de Permis de Construire</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations de base */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Demandeur</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="demandeur"
                    placeholder="Nom du demandeur"
                    value={formData.demandeur}
                    onChange={handleChange}
                    className={inputStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Propriétaire</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="proprietaire"
                    placeholder="Propriétaire"
                    value={formData.proprietaire}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Année</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    name="annee"
                    placeholder="Année"
                    value={formData.annee || ''}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commune</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="commune"
                    placeholder="Commune"
                    value={formData.commune}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="adresse"
                    placeholder="Adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localisation</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="localisation"
                    placeholder="Localisation"
                    value={formData.localisation}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Dates importantes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date d'arrivée APIPA</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    name="dateArriveeAPIPA"
                    value={formData.dateArriveeAPIPA}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date commission APIPA</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    name="dateCommissionAPIPA"
                    value={formData.dateCommissionAPIPA}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date définitive</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    name="dateDefinitive"
                    value={formData.dateDefinitive}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Catégorie et Situation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="regulier">Régulier</option>
                    <option value="irregulier">Irrégulier</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Situation PC</label>
                <div className="relative">
                  <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    name="situationPC"
                    value={formData.situationPC}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="non traite">Non traité</option>
                    <option value="traite">Traité</option>
                  </select>
                </div>
              </div>

              {/* Superficies */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Surface (m²)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    name="surface"
                    placeholder="Surface"
                    value={formData.surface || ''}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Superficie demandée (m²)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    name="superficieDemande"
                    placeholder="Superficie demandée"
                    value={formData.superficieDemande || ''}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Informations techniques */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Immatriculation terrain</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="immatriculationTerrain"
                    placeholder="Immatriculation terrain"
                    value={formData.immatriculationTerrain}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Référence</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="reference"
                    placeholder="Référence"
                    value={formData.reference}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service envoyeur</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="serviceEnvoyeur"
                    placeholder="Service envoyeur"
                    value={formData.serviceEnvoyeur}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Informations financières */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Avis de paiement</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="avisDePaiement"
                    placeholder="Avis de paiement"
                    value={formData.avisDePaiement}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Montant redevance (Ar)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    name="montantRedevance"
                    placeholder="Montant redevance"
                    value={formData.montantRedevance || ''}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Situation redevance</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="situationRedevance"
                    placeholder="Situation redevance"
                    value={formData.situationRedevance}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Prescription Urbanisme - Sur toute la largeur */}
            <div className="border-t border-slate-200 pt-6">
              <label className="block text-lg font-semibold text-slate-800 mb-4">Prescription Urbanisme</label>
              
              {/* Radio buttons pour le type de zone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Type de zone</label>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="zoneType"
                      checked={zoneConstructible === true}
                      onChange={() => handleZoneTypeChange(true)}
                      className="w-5 h-5 text-blue-500"
                    />
                    <span className="text-slate-700 font-medium">Zone constructible</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="zoneType"
                      checked={zoneConstructible === false}
                      onChange={() => handleZoneTypeChange(false)}
                      className="w-5 h-5 text-blue-500"
                    />
                    <span className="text-slate-700 font-medium">Zone non constructible</span>
                  </label>
                </div>
              </div>

              {/* Sélecteur pour le sous-type de zone */}
              {zoneConstructible !== null && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type de zone {zoneConstructible ? 'constructible' : 'non constructible'}
                  </label>
                  <div className="relative max-w-2xl">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      value={formData.sousTypeZone}
                      onChange={handleSousTypeChange}
                      className={inputStyle}
                      required
                    >
                      <option value="">Sélectionnez un type de zone...</option>
                      {(zoneConstructible ? zonesConstructibles : zonesNonConstructibles).map((zone, index) => (
                        <option key={index} value={zone}>
                          {zone.charAt(0).toUpperCase() + zone.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Textareas pour les observations */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Avis commission descente</label>
              <div className="relative max-w-2xl">
                <FileText className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <textarea
                  name="avisCommissionDescente"
                  placeholder="Avis commission descente"
                  value={formData.avisCommissionDescente}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observation commission</label>
              <div className="relative max-w-2xl">
                <FileText className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <textarea
                  name="observationCommission"
                  placeholder="Observation commission"
                  value={formData.observationCommission}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 pt-4 border-t border-slate-200 mt-6 max-w-2xl">
              <button 
                type="submit" 
                className="flex-grow px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                Enregistrer la demande
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-grow px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section tableau (à implémenter) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center text-slate-500 py-8">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>Aucune demande de permis de construire enregistrée</p>
        </div>
      </div>
    </div>
  );
};

export default FormulairePC;
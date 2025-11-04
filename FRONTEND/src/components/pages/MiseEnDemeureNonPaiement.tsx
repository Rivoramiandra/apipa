import React, { useState } from 'react';
import { Send, FileText, MapPin, Calendar, AlertTriangle, X } from 'lucide-react';
import { APData } from './ListeAP';

interface MiseEnDemeureNonPaiementProps {
  ap: APData;
  onClose: () => void;
  onSuccess: () => void;
  loading?: boolean;
}

interface MiseEnDemeureFormData {
  nouveau_delai_paiement: string;
  message_personnalise: string;
}

const MiseEnDemeureNonPaiement: React.FC<MiseEnDemeureNonPaiementProps> = ({
  ap,
  onClose,
  onSuccess,
  loading = false
}) => {
  const [formData, setFormData] = useState<MiseEnDemeureFormData>({
    nouveau_delai_paiement: '',
    message_personnalise: ''
  });

  const [sending, setSending] = useState(false);

  // Fonction pour mettre à jour le statut de l'AP
  const updateAPStatus = async (apId: number): Promise<boolean> => {
    try {
      console.log('🔄 Mise à jour du statut de l\'AP vers "en attente de paiement":', apId);
      
      const response = await fetch(`http://localhost:3000/api/ap/${apId}/statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statut: 'en attente de paiement',
          date_mise_a_jour: new Date().toISOString(),
          // Vous pouvez aussi mettre à jour la date limite de paiement si nécessaire
          date_delai_payment: formData.nouveau_delai_paiement || undefined
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Statut AP mis à jour avec succès:', result);
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut AP:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      console.log('🔄 Envoi de mise en demeure pour non-paiement:', {
        ap_id: ap.id,
        ...formData
      });

      // Étape 1: Envoyer la mise en demeure
      const response = await fetch('http://localhost:3000/api/aps/mise-en-demeure-non-paiement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ap_id: ap.id,
          reference_ft: ap.reference_ft,
          num_ap: ap.num_ap,
          nouveau_delai_paiement: formData.nouveau_delai_paiement,
          message_personnalise: formData.message_personnalise
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la mise en demeure');
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Mise en demeure envoyée:', result.message);
        
        // Étape 2: Mettre à jour le statut de l'AP
        const statusUpdated = await updateAPStatus(ap.id);
        
        if (statusUpdated) {
          console.log('✅ Statut mis à jour vers: en attente de paiement');
          
          // Afficher un message de confirmation
          alert('✅ Mise en demeure envoyée avec succès !\nLe statut a été mis à jour en "en attente de paiement".');
          
          onSuccess();
        } else {
          console.warn('⚠️ Mise en demeure envoyée mais échec de la mise à jour du statut');
          alert('✅ Mise en demeure envoyée !\n⚠️ Le statut n\'a pas pu être mis à jour automatiquement.');
          onSuccess(); // On appelle quand même onSuccess pour rafraîchir
        }
      } else {
        throw new Error(result.message || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('❌ Erreur envoi mise en demeure:', err);
      alert('Erreur lors de l\'envoi de la mise en demeure: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setSending(false);
    }
  };

  const handleChange = (field: keyof MiseEnDemeureFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white z-10 rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Send className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Mise en Demeure - Non Paiement
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Envoi d'une mise en demeure pour défaut de paiement
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              disabled={sending}
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne de gauche : Informations de l'AP */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations de l'Avis de Paiement
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Référence FT:</span>
                    <span className="text-sm font-medium text-blue-900">{ap.reference_ft}</span>
                  </div>
                  
                  {ap.num_ap && (
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Numéro AP:</span>
                      <span className="text-sm font-medium text-blue-900">{ap.num_ap}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Date FT:</span>
                    <span className="text-sm font-medium text-blue-900">
                      {new Date(ap.date_ft).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Ajout du statut actuel */}
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Statut actuel:</span>
                    <span className="text-sm font-medium text-blue-900 bg-blue-100 px-2 py-1 rounded">
                      {ap.statut || 'Non spécifié'}
                    </span>
                  </div>
                  
                  {ap.infraction && (
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Infraction:</span>
                      <span className="text-sm font-medium text-blue-900 text-right max-w-[200px]">
                        {ap.infraction.length > 50 
                          ? `${ap.infraction.substring(0, 50)}...` 
                          : ap.infraction}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations terrain */}
              {ap.titre_terrain && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Informations Terrain
                  </h4>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-green-700">Titre:</span>
                      <p className="text-sm font-medium text-green-900">{ap.titre_terrain}</p>
                    </div>
                    
                    {ap.localite && (
                      <div>
                        <span className="text-sm text-green-700">Localité:</span>
                        <p className="text-sm font-medium text-green-900">{ap.localite}</p>
                      </div>
                    )}
                    
                    {ap.superficie && (
                      <div>
                        <span className="text-sm text-green-700">Superficie:</span>
                        <p className="text-sm font-medium text-green-900">
                          {new Intl.NumberFormat('fr-FR').format(ap.superficie)} m²
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Avertissement */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Avertissement Important</h4>
                    <p className="text-sm text-red-700">
                      La mise en demeure est une étape formelle précédant d'éventuelles poursuites judiciaires. 
                      Vérifiez l'exactitude des informations avant envoi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Information changement de statut */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-2">Changement de statut automatique</h4>
                    <p className="text-sm text-yellow-700">
                      Après l'envoi de la mise en demeure, le statut de cet AP sera automatiquement 
                      mis à jour en <strong>"en attente de paiement"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne de droite : Formulaire de mise en demeure */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nouveau délai de paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Nouveau délai de paiement *
                  </label>
                  <input
                    type="date"
                    value={formData.nouveau_delai_paiement}
                    onChange={(e) => handleChange('nouveau_delai_paiement', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min={new Date().toISOString().split('T')[0]} // Pas de dates dans le passé
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Date limite pour régulariser le paiement
                  </p>
                </div>

                {/* Message personnalisé */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message personnalisé (optionnel)
                  </label>
                  <textarea
                    value={formData.message_personnalise}
                    onChange={(e) => handleChange('message_personnalise', e.target.value)}
                    rows={4}
                    placeholder="Ajoutez un message personnalisé pour le contrevenant..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ce message sera inclus dans la mise en demeure
                  </p>
                </div>

                {/* Aperçu du contenu standard */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2 text-sm">
                    Contenu standard de la mise en demeure:
                  </h5>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Rappel du défaut de paiement de l'avis de paiement {ap.num_ap || ap.reference_ft}</p>
                    <p>• Mise en demeure de régulariser la situation avant le {formData.nouveau_delai_paiement ? new Date(formData.nouveau_delai_paiement).toLocaleDateString('fr-FR') : 'date à définir'}</p>
                    <p>• Mention des poursuites judiciaires en cas de non-réponse</p>
                    {formData.message_personnalise && (
                      <p>• Message personnalisé inclus</p>
                    )}
                  </div>
                </div>

                {/* Information sur les actions */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2 text-sm">
                    Actions qui seront effectuées:
                  </h5>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>✓ Envoi de la mise en demeure par email</p>
                    <p>✓ Mise à jour du statut en "en attente de paiement"</p>
                    <p>✓ Notification du contrevenant</p>
                    <p>✓ Enregistrement dans l'historique</p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || !formData.nouveau_delai_paiement}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Envoyer la mise en demeure</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiseEnDemeureNonPaiement;
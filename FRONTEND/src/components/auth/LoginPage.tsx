import React, { useState } from 'react';
import { Lock, User, Shield, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userData: { role: 'admin' | 'agent'; name: string; email: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'admin' | 'agent'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Données de test pour la démo
  const testUsers = {
    admin: {
      email: 'admin@apipa.mg',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin' as const
    },
    agent: {
      email: 'agent@apipa.mg',
      password: 'agent123',
      name: 'Agent User',
      role: 'agent' as const
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    // Simulation d'authentification
    setTimeout(() => {
      const user = testUsers[userType];
      
      if (email !== user.email) {
        setErrorMessage('Email invalide');
        setIsLoading(false);
      } else if (password !== user.password) {
        setErrorMessage('Mot de passe invalide');
        setIsLoading(false);
      } else {
        setShowSuccessModal(true);
        setIsLoading(false);
        
        // Appeler la fonction de connexion après un délai
        setTimeout(() => {
          onLogin(user);
        }, 2000);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Sélection du type d'utilisateur */}
          <div className="p-8 lg:p-12 bg-white">
            <div className="h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-md overflow-hidden">
                  <img 
                    src="https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100066615102365" 
                    alt="APIPA Logo" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">APIPA</h2>
                <p className="text-gray-500">Sélectionnez votre profil</p>
              </div>

              <div className="space-y-4">
                {/* Admin Option */}
                <button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`w-full p-4 bg-white border border-gray-300 rounded-lg transition-all duration-200 text-left hover:border-blue-500 hover:shadow-md ${
                    userType === 'admin' 
                      ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50 shadow-md' 
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      userType === 'admin' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-lg">Administrateur</h4>
                      <p className="text-gray-600 text-sm mt-1">
                        Accès complet à toutes les fonctionnalités
                      </p>
                    </div>
                    {userType === 'admin' && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </button>

                {/* Agent Option */}
                <button
                  type="button"
                  onClick={() => setUserType('agent')}
                  className={`w-full p-4 bg-white border border-gray-300 rounded-lg transition-all duration-200 text-left hover:border-green-500 hover:shadow-md ${
                    userType === 'agent' 
                      ? 'border-green-500 ring-2 ring-green-200 bg-green-50 shadow-md' 
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      userType === 'agent' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-lg">Agent</h4>
                      <p className="text-gray-600 text-sm mt-1">
                        Interface simplifiée pour le terrain
                      </p>
                      
                    </div>
                    {userType === 'agent' && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              </div>

              {/* Indicateur visuel du type sélectionné */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Profil sélectionné :</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    userType === 'admin' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    {userType === 'admin' ? 'Administrateur' : 'Agent'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Formulaire */}
          <div className="p-8 lg:p-12 bg-white border-l border-gray-200">
            <div className="h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Connexion</h3>
                <p className="text-gray-500">Entrez vos identifiants pour accéder à votre espace</p>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Votre email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Votre mot de passe"
                      required
                    />
                  </div>
                </div>

                {/* Informations de test */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 text-center">
                    <strong>Test {userType}:</strong><br />
                    Email: {testUsers[userType].email}<br />
                    Mot de passe: {testUsers[userType].password}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                    userType === 'admin' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500'
                  }`}
                >
                  {isLoading ? 'Connexion...' : `Se connecter`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-xl text-center">
            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
              userType === 'admin' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <UserCheck className={`w-6 h-6 ${userType === 'admin' ? 'text-blue-600' : 'text-green-600'}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Connexion réussie !</h3>
            <p className="text-gray-600 mb-4">
              Bienvenue {userType === 'admin' ? 'Administrateur' : 'Agent'}
            </p>
            <p className="text-sm text-gray-500">Redirection vers le tableau de bord...</p>
          </div>
        </div>
      )}

      {/* Modal d'erreur */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-4">Erreur de connexion</h3>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage('')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
import React, { useState, useEffect } from 'react';
import { Lock, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: (success: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (email !== 'admin@example.com') {
        setErrorMessage('Email invalid');
        setIsLoading(false);
      } else if (password !== 'admin123') {
        setErrorMessage('Mot de passe invalid');
        setIsLoading(false);
      } else {
        setShowSuccessModal(true);
        setIsLoading(false);
      }
    }, 1000);
  };

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        onLogin(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, onLogin]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Logo et Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-md overflow-hidden">
              <img 
                src="https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100066615102365" 
                alt="APIPA Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">APIPA Admin</h2>
            <p className="text-gray-500">Connectez-vous à votre tableau de bord</p>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

     
        </div>
      </div>
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-green-600 mb-4">Connexion réussie !</h3>
            <p className="text-gray-600">Redirection vers le tableau de bord en cours...</p>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-xl">
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
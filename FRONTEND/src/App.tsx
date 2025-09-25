import React, { useState, useEffect } from "react";
import LoginPage from "./components/auth/LoginPage";
import AdminLayout from "./components/layout/AdminLayout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On supprime le token à chaque lancement
    localStorage.removeItem("adminToken");
    setLoading(false);
  }, []);

  const handleLogin = (success: boolean) => {
    if (success) {
      // Stockage optionnel (utile si tu veux voir le token côté dev)
      localStorage.setItem("adminToken", "authenticated");
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500 text-lg animate-pulse">
          Chargement de l'application...
        </p>
      </div>
    );
  }

  return isAuthenticated ? (
    <AdminLayout onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}

export default App;

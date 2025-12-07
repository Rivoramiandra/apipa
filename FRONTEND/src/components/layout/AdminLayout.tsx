import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Cartography from '../pages/Cartography';
import Descente from '../pages/Descente';
import Notifications from '../pages/Notifications';
import TruckAuthorization from '../pages/TruckAuthorization';
import DemandePC from '../pages/FormulairePC';
import RendezvousComponent from '../pages/RendezvousComponent';
import FT from '../pages/FT';
import AvisDePayement from '../pages/AvisDePayement';
import Header from './Header';
import GestionPaiements from '../pages/Paiements';

interface AdminLayoutProps {
  onLogout: () => void;
  userRole: 'admin' | 'agent';
  userName: string;
  userEmail: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, userRole, userName, userEmail }) => {
  const [activeSection, setActiveSection] = useState(userRole === 'admin' ? 'dashboard' : 'descente');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Définition des sections accessibles par rôle
  const getAccessibleSections = () => {
    const baseSections = {
      dashboard: <Dashboard />,
      cartography: <Cartography />,
      descente: <Descente />,
      notifications: <Notifications />,
      'truck-authorization': <TruckAuthorization />,
      'pc-request': <DemandePC />,
      rendezvous: <RendezvousComponent />,
      ft: <FT />,
      avisdepayement: <AvisDePayement />,
      paiements: <GestionPaiements />
    };

    if (userRole === 'admin') {
      return baseSections;
    } else {
      // Agent n'a accès qu'à rapport descente et cartographie
      return {
        descente: baseSections.descente,
        cartography: baseSections.cartography
      };
    }
  };

  const renderContent = () => {
    const accessibleSections = getAccessibleSections();
    return accessibleSections[activeSection as keyof typeof accessibleSections] || <div>Section non autorisée</div>;
  };

  // Vérifier si c'est la section cartography pour appliquer un style différent
  const isCartography = activeSection === 'cartography';

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onLogout={onLogout}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
        />
        
        {/* Contenu principal avec style conditionnel pour la cartographie */}
        <main className={`flex-1 overflow-y-auto bg-slate-50 ${isCartography ? 'p-0 mt-0' : 'p-1 sm:p-6 mt-16'}`}>
          {isCartography ? (
            renderContent()
          ) : (
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
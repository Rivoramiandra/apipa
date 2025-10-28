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



interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'cartography':
        return <Cartography />;
      case 'descente':
        return <Descente />;
      case 'notifications':
        return <Notifications />;
      case 'truck-authorization':
        return <TruckAuthorization />;
      case 'pc-request':
        return <DemandePC />;
      case 'rendezvous':
        return <RendezvousComponent />;
              case 'ft':
        return <FT />;
                      case 'avisdepayement':
        return <AvisDePayement/>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onLogout={onLogout}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Ajout de mt-16 pour compenser la hauteur du header fixe */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-1 sm:p-6 mt-16">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
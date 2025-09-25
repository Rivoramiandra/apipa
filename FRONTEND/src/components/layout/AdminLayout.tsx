import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../pages/Dashboard';
import Cartography from '../pages/Cartography';
import MaterialRequests from '../pages/MaterialRequests';
import FieldActions from '../pages/FieldActions';
import Notifications from '../pages/Notifications';
import TruckAuthorization from '../pages/TruckAuthorization';
import DemandePC from '../pages/FormulairePC';


interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'cartography':
        return <Cartography />;
      case 'material-requests':
        return <MaterialRequests />;
      case 'field-actions':
        return <FieldActions />;
        case 'notifications':
        return <Notifications />;
        case 'truck-authorization':
        return <TruckAuthorization />;
        case 'pc-request':
        return <DemandePC />;
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
        />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
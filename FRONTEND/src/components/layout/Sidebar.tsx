import React from 'react';
import { 
  LayoutDashboard, 
  Map,  
  MapPin, 
  Menu,
  ChevronLeft,
  LogOut,
  FileText,
  ClipboardList,
  CheckCircle,
  DollarSign,
  User
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  userRole: 'admin' | 'agent';
  userName: string;
  userEmail: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  setActiveSection, 
  collapsed, 
  setCollapsed,
  userRole,
  userName,
  userEmail 
}) => {
  
  // Configuration des menus par rôle
  const getMenuSections = () => {
    const baseSections = [];
    
    if (userRole === 'admin') {
      baseSections.push(
        {
          title: 'Général',
          items: [
            { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard }
          ]
        },
        {
          title: 'Géographique',
          items: [
            { id: 'cartography', label: 'Cartographie', icon: Map },
            { id: 'descente', label: 'Rapport de descente', icon: MapPin },
          ]
        },
        {
          title: 'Documents',
          items: [
            { id: 'rendezvous', label: 'Faire F.T', icon: FileText },
            { id: 'ft', label: 'Listes F.T', icon: ClipboardList },
            { id: 'avisdepayement', label: 'Faire A.P', icon: CheckCircle },
            { id: 'paiements', label: 'Paiements', icon: DollarSign },
          ]
        }
      );
    } else {
      // Menu pour Agent
      baseSections.push(
        {
          title: 'Géographique',
          items: [
            { id: 'descente', label: 'Rapport de descente', icon: MapPin },
            { id: 'cartography', label: 'Cartographie', icon: Map },
          ]
        }
      );
    }
    
    return baseSections;
  };

  const menuSections = getMenuSections();

  const handleLogout = () => {
    // Gérer la déconnexion
    window.location.reload(); // Ou appeler une fonction de déconnexion
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
          onClick={() => setCollapsed(true)} 
        />
      )}

      <aside className={`
        fixed lg:relative z-50 h-screen transition-all duration-300 ease-in-out
        bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50
        ${collapsed ? 'w-0 lg:w-20 overflow-hidden' : 'w-64 sm:w-72'}
        ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        flex flex-col shadow-xl
      `}>
        <div className="flex flex-col h-full">
          {/* Header avec logo */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700/50">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    APIPA
                  </span>
                  <span className="text-xs text-slate-400">
                    {userRole === 'admin' ? 'Administration' : 'Agent'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Bouton de toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`
                p-2 rounded-xl transition-all duration-200 group
                ${collapsed ? 'lg:flex hidden' : ''}
                bg-slate-800 hover:bg-slate-700/50 text-slate-400 hover:text-white
                border border-slate-700/50 hover:border-slate-600
                shadow-sm hover:shadow-md
              `}
            >
              {collapsed ? (
                <Menu className="w-4 h-4 group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>

          {/* Menu principal avec sections */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6 last:mb-0">
                {/* Titre de section (caché quand collapsed) */}
                {!collapsed && section.items.length > 0 && (
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pl-2 flex items-center">
                    <div className="w-1 h-1 bg-slate-500 rounded-full mr-2"></div>
                    {section.title}
                  </div>
                )}
                
                {/* Items du menu */}
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id);
                          if (window.innerWidth < 1024) setCollapsed(true);
                        }}
                        className={`
                          w-full flex items-center transition-all duration-200 group relative
                          ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5'}
                          ${isActive 
                            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg border-l-2 border-blue-400' 
                            : 'text-slate-300 hover:bg-slate-700/30 hover:text-white hover:border-l-2 hover:border-slate-500'
                          }
                          rounded-lg overflow-hidden
                        `}
                      >
                        {/* Indicateur visuel d'activité */}
                        {isActive && !collapsed && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r"></div>
                        )}

                        <div className="flex items-center gap-3 relative w-full">
                          <div className={`
                            p-1.5 rounded-lg transition-all duration-200
                            ${isActive 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-600/50 group-hover:text-slate-200'
                            }
                          `}>
                            <Icon className="w-4 h-4" />
                          </div>
                          
                          {!collapsed && (
                            <span className="font-medium text-sm flex-1 text-left">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {/* Tooltip pour mode collapsed */}
                        {collapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap border border-slate-700">
                            {item.label}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Footer avec déconnexion et info utilisateur */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
            <div className={`space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
              {/* Déconnexion */}
              <button 
                onClick={handleLogout}
                className={`
                  w-full flex items-center transition-all duration-200 group
                  ${collapsed ? 'justify-center px-3 py-2.5' : 'px-4 py-2.5'}
                  text-slate-300 hover:bg-red-500/20 hover:text-red-200 rounded-lg
                  border border-transparent hover:border-red-500/30
                `}
              >
                <div className={`
                  p-1.5 rounded-lg transition-all duration-200
                  bg-slate-700/50 group-hover:bg-red-500/20
                `}>
                  <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-300" />
                </div>
                {!collapsed && (
                  <span className="ml-3 font-medium text-sm group-hover:text-red-200">
                    Déconnexion
                  </span>
                )}
              </button>
            </div>

            {/* Info utilisateur */}
            {!collapsed && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                    <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                    <p className="text-xs text-blue-300 capitalize">{userRole}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
};

export default Sidebar;
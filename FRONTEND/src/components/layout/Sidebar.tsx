import React from 'react';
import { 
  Car, 
  LayoutDashboard, 
  Map, 
  Package, 
  MapPin, 
  Bell,
  Menu,
  ChevronLeft,
  LogOut,
  User,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, collapsed, setCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'cartography', label: 'Cartographie', icon: Map },
    { id: 'material-requests', label: 'Remblai', icon: Package },
    { id: 'field-actions', label: 'Descente sur terrain', icon: MapPin },
    { id: 'pc-request', label: 'Demande PC - Permis de construction', icon: FileText },
    { id: 'truck-authorization', label: 'Autorisation Camion', icon: Car },
    // ❌ Notification retirée du menu principal
  ];

  return (
    <>
      {/* Overlay mobile */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
          onClick={() => setCollapsed(true)} 
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-50 h-full transition-all duration-300 ease-in-out
        bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50
        ${collapsed ? 'w-0 lg:w-20' : 'w-72'}
        ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        flex flex-col
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  APIPA
                </span>
              </div>
            )}
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`
                p-2 rounded-xl transition-all duration-200
                ${collapsed ? 'lg:flex hidden' : ''}
                bg-slate-800 hover:bg-slate-700/50 text-slate-400 hover:text-white
                border border-slate-700/50 hover:border-slate-600
                shadow-sm hover:shadow-md
              `}
            >
              {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* User Profile (visible only when expanded) */}
          {!collapsed && (
            <div className="p-4 border-b border-slate-700/30">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">John Doe</p>
                  <p className="text-slate-400 text-xs truncate">Administrateur</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu */}
          <div className="flex-1 p-4 overflow-y-auto">
            {!collapsed && (
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 pl-3">
                Navigation Principale
              </div>
            )}

            <nav className="space-y-2">
              {menuItems.map((item) => {
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
                      ${collapsed ? 'justify-center px-3 py-4' : 'px-4 py-3'}
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg' 
                        : 'text-slate-300 hover:bg-slate-700/30 hover:text-white'
                      }
                      rounded-xl overflow-hidden
                    `}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-l"></div>
                    )}

                    <div className="flex items-center gap-3 relative w-full">
                      <Icon className="w-5 h-5 z-10" />
                      {!collapsed && (
                        <span className="font-medium truncate flex-1 text-left">
                          {item.label}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg -m-2"></div>
                    </div>

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
            <div className={`space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
              {/* ✅ Notification déplacée dans le footer avec badge 5 */}
              <button 
                onClick={() => {
                  setActiveSection('notifications');
                  if (window.innerWidth < 1024) setCollapsed(true);
                }}
                className={`
                  w-full flex items-center transition-all duration-200 group relative
                  ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2'}
                  ${activeSection === 'notifications'
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-700/30 hover:text-white'
                  }
                  rounded-xl
                `}
              >
                <div className="relative">
                  <Bell className="w-5 h-5 text-slate-400 group-hover:text-white" />
                  {/* ✅ Badge 5 */}
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    5
                  </span>
                </div>
                
                {!collapsed && (
                  <>
                    <span className="ml-3 font-medium">Notification</span>
                    {/* ✅ Badge supplémentaire pour l'état étendu */}
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full min-w-[1.5rem]">
                      5
                    </span>
                  </>
                )}
              </button>
              
              <button className={`
                w-full flex items-center transition-all duration-200 group
                ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2'}
                text-slate-300 hover:bg-red-500/20 hover:text-red-200 rounded-xl
              `}>
                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-300" />
                {!collapsed && <span className="ml-3 font-medium">Déconnexion</span>}
              </button>
            </div>
            
            {!collapsed && (
              <div className="mt-4 pt-4 border-t border-slate-700/30">
                <p className="text-xs text-slate-500 text-center">
                  Version 1.0.0
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
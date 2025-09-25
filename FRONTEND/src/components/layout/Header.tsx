import React, { useState } from 'react';
import { Bell, LogOut, User, Mail, Menu, Settings, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
  toggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogout, toggleSidebar, sidebarCollapsed }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200/60 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Toggle sidebar button - visible only when sidebar is collapsed */}
          {sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 relative group">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">3</span>
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
            </button>
          </div>

          {/* Messages */}
          <div className="relative">
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 relative group">
              <Mail className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">2</span>
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
            </button>
          </div>

          {/* Help */}
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200">
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 group"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-800">John Doe</div>
                <div className="text-xs text-slate-500">Administrateur</div>
              </div>

              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Dropdown */}
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/60 py-2 z-[9999]
                  animate-[fadeIn_0.15s_ease-out]"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-medium text-slate-800">John Doe</div>
                    <div className="text-xs text-slate-500 mt-1">john.doe@apipa.mg</div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Mon profil</span>
                    </button>

                    <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200">
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Paramètres</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100 pt-2">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </header>
  );
};

export default Header;

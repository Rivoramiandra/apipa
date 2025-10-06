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
    <header className="bg-white border-b border-slate-200/60 px-4 sm:px-6 py-3 shadow-sm fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Toggle sidebar button */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          {sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 hidden lg:block"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button className="p-1 sm:p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 relative group">
              <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
              <div className="absolute -top-1 -right-1 w-3 sm:w-4 h-3 sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-white font-bold">3</span>
              </div>
              <div className="absolute -top-2 -right-2 w-4 sm:w-5 h-4 sm:h-5 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
            </button>
          </div>

          {/* Messages */}
          <div className="relative hidden sm:block">
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 relative group">
              <Mail className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">2</span>
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
            </button>
          </div>

          {/* Help */}
          <button className="p-1 sm:p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 hidden sm:block">
            <HelpCircle className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 sm:space-x-3 p-1 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 group"
            >
              <div className="text-right hidden md:block">
                <div className="text-xs sm:text-sm font-medium text-slate-800">John Doe</div>
                <div className="text-[10px] sm:text-xs text-slate-500">Administrateur</div>
              </div>

              <div className="relative">
                <div className="w-7 sm:w-9 h-7 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-2 sm:w-3 h-2 sm:h-3 bg-green-400 rounded-full border-2 border-white"></div>
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
                  className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-xl border border-slate-200/60 py-2 z-[9999]
                  animate-[fadeIn_0.15s_ease-out]"
                >
                  {/* User info */}
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-100">
                    <div className="text-xs sm:text-sm font-medium text-slate-800">John Doe</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-1">john.doe@apipa.mg</div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1 sm:py-2">
                    <button className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200">
                      <User className="w-3 sm:w-4 h-3 sm:h-4 text-slate-500" />
                      <span>Mon profil</span>
                    </button>

                    <button className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200">
                      <Settings className="w-3 sm:w-4 h-3 sm:h-4 text-slate-500" />
                      <span>Paramètres</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100 pt-1 sm:pt-2">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut className="w-3 sm:w-4 h-3 sm:h-4" />
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
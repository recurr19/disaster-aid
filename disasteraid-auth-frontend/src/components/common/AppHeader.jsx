import React from 'react';
import { LogOut } from 'lucide-react';
import { Logo } from './Logo';

/**
 * AppHeader - shared branded header for dashboards and pages
 * Props:
 * - title?: string
 * - subtitle?: string
 * - rightSlot?: ReactNode (optional custom right side content)
 * - onLogout?: () => void (shows Logout button if provided)
 */
const AppHeader = ({ title, subtitle, rightSlot, onLogout }) => {
  return (
    <header className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm sticky top-0 z-50 border-b border-white/50">
      <div className="relative">
        {/* Soft gradient strip */}
        <div className="absolute inset-x-0 -top-6 h-12 bg-gradient-to-r from-rose-100 via-rose-50 to-indigo-50 opacity-70 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo variant="icon" size={36} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                {title || 'DisasterAid'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {subtitle || 'Crisis Relief Platform'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {rightSlot}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

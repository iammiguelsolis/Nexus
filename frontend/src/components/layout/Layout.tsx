import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/sessions', label: 'Sesiones', icon: '🎯' },
  { path: '/vacancies', label: 'Vacantes', icon: '💼' },
];

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar - Desktop (Fixed al viewport height) */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 w-64 h-screen bg-dark-800/80 backdrop-blur-xl border-r border-dark-700/50 z-30">
        {/* Logo */}
        <div className="p-6 border-b border-dark-700/50 flex-shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-nexus flex items-center justify-center shadow-lg shadow-nexus-700/30">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-display tracking-tight">NEXUS</h1>
              <p className="text-[10px] text-dark-400 uppercase tracking-widest">Talento Digital</p>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-shrink-0 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-nexus-700/30 text-nexus-300 border border-nexus-600/30 shadow-sm'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer - toma todo el espacio disponible */}
        <div className="flex-1" />

        {/* User Profile - Siempre al final */}
        <div className="p-4 border-t border-dark-700/50 flex-shrink-0">
          <div className="rounded-xl p-3 bg-dark-700/40 border border-dark-700/60 hover:bg-dark-700/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gradient-nexus flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.nombres} {user?.apellidos}</p>
                <p className="text-xs text-dark-400">{user?.rol}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full mt-3 text-xs text-dark-400 hover:text-danger-400 transition-colors py-1.5 rounded-lg hover:bg-dark-700/50">
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-800/90 backdrop-blur-xl border-b border-dark-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display font-bold text-white text-lg">NEXUS</span>
          <div className="w-8 h-8 rounded-lg gradient-nexus flex items-center justify-center text-white text-xs font-bold">
            {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-dark-800 border-r border-dark-700/50 animate-slide-in-right">
            <div className="p-6 border-b border-dark-700/50">
              <h1 className="text-xl font-bold text-white font-display">NEXUS</h1>
            </div>
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${location.pathname.startsWith(item.path)
                      ? 'bg-nexus-700/30 text-nexus-300'
                      : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700/50">
              <button onClick={handleLogout} className="w-full text-sm text-dark-400 hover:text-danger-400 py-2">
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content - con offset para sidebar fixed */}
      <main className="flex-1 lg:ml-64 overflow-auto pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

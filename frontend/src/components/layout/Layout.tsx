import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/profile', label: 'Mi Perfil', icon: '👤' },
  { path: '/onboarding', label: 'Onboarding', icon: '🚀' },
  { path: '/matching', label: 'Matching', icon: '🔗' },
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

  const linkStyle = (active: boolean) => ({
    backgroundColor: active ? 'var(--color-primary-800)' : 'transparent',
    color: active ? 'var(--color-primary-200)' : 'var(--color-neutral-400)',
  });

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--surface-page)' }}>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-60"
             style={{ backgroundColor: 'var(--surface-sidebar)', borderRight: '1px solid var(--color-neutral-700)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--color-neutral-700)' }}>
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                 style={{ backgroundColor: 'var(--color-primary-500)' }}>
              <span className="text-white font-bold">N</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-display" style={{ color: 'var(--text-inverse)' }}>NEXUS</h1>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-neutral-500)' }}>Talento Digital</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} to={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
                  style={linkStyle(location.pathname.startsWith(item.path))}
                  id={`nav-${item.path.slice(1)}`}>
              <span>{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid var(--color-neutral-700)' }}>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-neutral-800)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                   style={{ backgroundColor: 'var(--color-primary-600)' }}>
                {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-inverse)' }}>
                  {user?.nombres} {user?.apellidos}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-neutral-500)' }}>
                  {user?.rol === 'Jedi' ? 'Mentor Jedi' : user?.rol}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} id="btn-logout"
                    className="w-full mt-3 text-xs py-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--color-neutral-400)' }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3"
           style={{ backgroundColor: 'var(--surface-card)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display font-bold text-lg">NEXUS</span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
               style={{ backgroundColor: 'var(--color-primary-500)' }}>
            {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ backgroundColor: 'var(--surface-overlay)' }}
               onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full animate-slide-right" style={{ backgroundColor: 'var(--surface-sidebar)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid var(--color-neutral-700)' }}>
              <h1 className="text-lg font-bold font-display" style={{ color: 'var(--text-inverse)' }}>NEXUS</h1>
            </div>
            <nav className="p-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                      style={linkStyle(location.pathname.startsWith(item.path))}>
                  <span>{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4" style={{ borderTop: '1px solid var(--color-neutral-700)' }}>
              <button onClick={handleLogout} className="w-full text-sm py-2" style={{ color: 'var(--color-neutral-400)' }}>
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

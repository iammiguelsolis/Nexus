import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { notificationService } from '../../services/api';
import { BarChart2, User, Rocket, Link as LinkIcon, Target, Briefcase, XCircle, CheckCircle2, TrendingUp, Trophy, MessageSquare, AlertTriangle, Mail, Bell, Menu } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { path: '/profile', label: 'Mi Perfil', icon: User },
  { path: '/onboarding', label: 'Onboarding', icon: Rocket },
  { path: '/matching', label: 'Matching', icon: LinkIcon },
  { path: '/sessions', label: 'Sesiones', icon: Target },
  { path: '/vacancies', label: 'Vacantes', icon: Briefcase },
];

interface Notification {
  notificacion_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
}

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.list(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(listRes.data.data);
      setUnreadCount(countRes.data.data.unread);
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch { /* silent */ }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch { /* silent */ }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkStyle = (active: boolean) => ({
    backgroundColor: active ? 'var(--color-primary-800)' : 'transparent',
    color: active ? 'var(--color-primary-200)' : 'var(--color-neutral-400)',
  });

  const TIPO_ICONS: Record<string, any> = {
    nueva_sesion: Target, sesion_cancelada: XCircle, sesion_realizada: CheckCircle2,
    okr_creado: TrendingUp, okr_completado: Trophy, okr_feedback: MessageSquare,
    matching_nuevo: LinkIcon, matching_aceptado: CheckCircle2, matching_rechazado: XCircle,
    riesgo_abandono: AlertTriangle, vacante_nueva: Briefcase, postulacion_recibida: Mail,
    sistema: Bell,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-page)' }}>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 z-50"
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
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
            <Link key={item.path} to={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
                  style={linkStyle(location.pathname.startsWith(item.path))}
                  id={`nav-${item.path.slice(1)}`}>
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )})}
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
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-display font-bold text-lg">NEXUS</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-1">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: 'var(--color-danger)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                 style={{ backgroundColor: 'var(--color-primary-500)' }}>
              {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
            </div>
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
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                      style={linkStyle(location.pathname.startsWith(item.path))}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              )})}
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
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 lg:ml-60 relative min-h-screen">
        {/* Desktop notification bell */}
        <div className="hidden lg:flex items-center justify-end p-4 pb-0">
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: notifOpen ? 'var(--color-primary-100)' : 'transparent' }}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: 'var(--color-danger)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notification dropdown */}
        {notifOpen && (
          <div className="absolute right-4 top-14 lg:top-12 w-80 z-50 rounded-lg overflow-hidden animate-fade-in"
               style={{ backgroundColor: 'var(--surface-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notificaciones</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-medium" style={{ color: 'var(--color-primary-500)' }}>
                  Marcar todas leídas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-2"><Bell className="w-8 h-8" style={{ color: 'var(--text-muted)' }} /></div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin notificaciones</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => {
                  const Icon = TIPO_ICONS[n.tipo] || Bell;
                  return (
                  <div key={n.notificacion_id}
                       onClick={() => { if (!n.leida) handleMarkRead(n.notificacion_id); }}
                       className="flex items-start gap-3 p-3 transition-colors cursor-pointer"
                       style={{
                         backgroundColor: n.leida ? 'transparent' : 'var(--color-primary-50)',
                         borderBottom: '1px solid var(--border-light)',
                       }}>
                    <span className="mt-1"><Icon className="w-4 h-4" /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{n.titulo}</p>
                      {n.mensaje && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{n.mensaje}</p>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        {new Date(n.fecha_creacion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.leida && (
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-500)' }} />
                    )}
                  </div>
                )})
              )}
            </div>
          </div>
        )}

        {/* Click outside to close notifs */}
        {notifOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
        )}

        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

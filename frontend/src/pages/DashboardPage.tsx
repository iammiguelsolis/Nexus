import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { sessionService } from '../services/api';
import type { Session } from '../types';
import { LoadingSpinner, Badge } from '../components/ui';
import { formatDateTime, getEstadoSesionColor } from '../utils/helpers';

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    sessionService.getMySessions()
      .then((res) => setSessions(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const score = user?.score_empleabilidad || 0;
  const gaugeData = [{ name: 'Score', value: score }];
  const isJedi = user?.rol === 'Jedi';
  const isPadawan = user?.rol === 'Padawan';

  const upcomingSessions = sessions
    .filter((s) => s.estado === 'Programada' && new Date(s.fecha_sesion) > new Date())
    .sort((a, b) => new Date(a.fecha_sesion).getTime() - new Date(b.fecha_sesion).getTime());

  const completedSessions = sessions.filter((s) => s.estado === 'Realizada');
  const nextSession = upcomingSessions[0];

  // Get partner info (mentor for padawan, padawan for jedi)
  const partner = sessions[0] ? {
    nombres: isJedi ? sessions[0].padawan_nombres : sessions[0].mentor_nombres,
    apellidos: isJedi ? sessions[0].padawan_apellidos : sessions[0].mentor_apellidos,
  } : null;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-display">
          ¡Hola, <span className="text-gradient">{user?.nombres}</span>! 👋
        </h1>
        <p className="text-dark-400 mt-1">
          {isJedi ? 'Panel de Mentor Jedi — Guía a tus Padawans' : 'Aquí está tu progreso en NEXUS'}
        </p>
      </div>

      {/* Role Badge + Matching Info */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4 flex-wrap">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg ${isJedi ? 'gradient-success shadow-success-700/30' : 'gradient-nexus shadow-nexus-700/30'}`}>
          {isJedi ? '🧙‍♂️' : '🎓'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={isJedi ? 'bg-success-600/20 text-success-300 border-success-500/30' : 'bg-nexus-600/20 text-nexus-300 border-nexus-500/30'}>
              {user?.rol}
            </Badge>
            <span className="text-dark-400 text-sm">{user?.email}</span>
          </div>
          {partner ? (
            <p className="text-white text-sm">
              {isJedi ? '🎓 Tu Padawan:' : '🧙‍♂️ Tu Mentor:'}{' '}
              <span className="font-semibold text-nexus-300">{partner.nombres} {partner.apellidos}</span>
              <span className="text-dark-400"> · Matching activo</span>
            </p>
          ) : (
            <p className="text-dark-400 text-sm">Sin matching asignado aún</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Employability Score Gauge (Padawan) / Mentee Stats (Jedi) */}
        {isPadawan ? (
          <div className="glass rounded-2xl p-6 col-span-1 card-hover">
            <h3 className="text-sm font-medium text-dark-400 mb-2">Score de Empleabilidad</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="70%" outerRadius="100%"
                    startAngle={225} endAngle={-45}
                    data={gaugeData}
                    barSize={12}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#1F2937' }}>
                      <Cell fill="url(#scoreGradient)" />
                    </RadialBar>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#1F3A6E" />
                        <stop offset="50%" stopColor="#2E5FA3" />
                        <stop offset="100%" stopColor="#1D9E75" />
                      </linearGradient>
                    </defs>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white font-display">{score}</span>
                  <span className="text-xs text-dark-400 mt-1">de 100</span>
                </div>
              </div>
            </div>
            <p className="text-center text-dark-400 text-sm mt-2">
              Completa OKRs para aumentar tu score (+12 por OKR)
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 card-hover">
            <h3 className="text-sm font-medium text-dark-400 mb-4">Tu Impacto como Mentor</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-700/40">
                <span className="text-dark-200 text-sm">Sesiones realizadas</span>
                <span className="text-success-400 font-bold text-2xl">{completedSessions.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-700/40">
                <span className="text-dark-200 text-sm">Sesiones programadas</span>
                <span className="text-nexus-400 font-bold text-2xl">{upcomingSessions.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-700/40">
                <span className="text-dark-200 text-sm">Calificación</span>
                <span className="text-warning-400 font-bold text-2xl">
                  ⭐ {user?.calificacion_promedio || '4.85'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Session */}
        <div className="glass rounded-2xl p-6 card-hover">
          <h3 className="text-sm font-medium text-dark-400 mb-4">Próxima Sesión</h3>
          {nextSession ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-nexus-700/30 flex items-center justify-center text-nexus-400 text-xl flex-shrink-0">
                  🎯
                </div>
                <div>
                  <h4 className="font-semibold text-white text-lg">{nextSession.titulo}</h4>
                  <p className="text-dark-400 text-sm mt-1">{formatDateTime(nextSession.fecha_sesion)}</p>
                  <Badge className={`mt-2 ${getEstadoSesionColor(nextSession.estado)}`}>
                    {nextSession.estado}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <span>⏱</span>
                <span>{nextSession.duracion_min} min</span>
                <span className="text-dark-600">·</span>
                <span>
                  con {isJedi ? nextSession.padawan_nombres : nextSession.mentor_nombres}{' '}
                  {isJedi ? nextSession.padawan_apellidos : nextSession.mentor_apellidos}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-4xl mb-3">📅</span>
              <p className="text-dark-400 text-sm">No hay sesiones programadas</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="glass rounded-2xl p-6 card-hover">
          <h3 className="text-sm font-medium text-dark-400 mb-4">Resumen</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-700/40">
              <div className="flex items-center gap-3">
                <span className="text-xl">📚</span>
                <span className="text-dark-200 text-sm">Sesiones totales</span>
              </div>
              <span className="text-white font-bold text-lg">{sessions.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-700/40">
              <div className="flex items-center gap-3">
                <span className="text-xl">✅</span>
                <span className="text-dark-200 text-sm">Sesiones realizadas</span>
              </div>
              <span className="text-success-400 font-bold text-lg">{completedSessions.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-700/40">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <span className="text-dark-200 text-sm">Próximas</span>
              </div>
              <span className="text-nexus-400 font-bold text-lg">{upcomingSessions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/sessions" className="glass rounded-2xl p-6 card-hover group flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl gradient-nexus flex items-center justify-center text-2xl shadow-lg shadow-nexus-700/30 group-hover:scale-110 transition-transform">
            🎯
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">
              {isJedi ? 'Sesiones de Mentoría' : 'Mis Sesiones'}
            </h3>
            <p className="text-dark-400 text-sm">
              {isJedi ? 'Gestiona sesiones con tu Padawan' : 'Gestiona tus sesiones de mentoría'}
            </p>
          </div>
          <svg className="w-5 h-5 text-dark-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link to="/vacancies" className="glass rounded-2xl p-6 card-hover group flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl gradient-success flex items-center justify-center text-2xl shadow-lg shadow-success-700/30 group-hover:scale-110 transition-transform">
            💼
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Vacantes</h3>
            <p className="text-dark-400 text-sm">
              {isPadawan ? 'Postula a oportunidades laborales' : 'Explora oportunidades para tus Padawans'}
            </p>
          </div>
          <svg className="w-5 h-5 text-dark-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;

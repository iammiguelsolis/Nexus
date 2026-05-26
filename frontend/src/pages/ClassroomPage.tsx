import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { classroomService, sessionService } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import FeedTab from '../components/classroom/FeedTab';
import WorkTab from '../components/classroom/WorkTab';
import PeopleTab from '../components/classroom/PeopleTab';
import ChatWidget from '../components/classroom/ChatWidget';
import type { ClassroomPost, ClassroomPeople, Session } from '../types';
import api from '../services/api';

type Tab = 'novedades' | 'trabajo' | 'personas';

const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #1a73e8 0%, #4285f4 50%, #669df6 100%)',
  'linear-gradient(135deg, #0d652d 0%, #1e8e3e 50%, #34a853 100%)',
  'linear-gradient(135deg, #e37400 0%, #f9ab00 50%, #fdd663 100%)',
  'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 50%, #ce93d8 100%)',
  'linear-gradient(135deg, #00695c 0%, #009688 50%, #4db6ac 100%)',
];

const getGradient = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return BANNER_GRADIENTS[Math.abs(h) % BANNER_GRADIENTS.length];
};

const ClassroomPage = () => {
  const { matchingId } = useParams<{ matchingId: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('novedades');
  const [posts, setPosts] = useState<ClassroomPost[]>([]);
  const [people, setPeople] = useState<ClassroomPeople | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = () => {
    if (!matchingId) return;
    classroomService.getFeed(matchingId).then(r => setPosts(r.data.data)).catch(() => {});
  };

  const loadSessions = () => {
    if (!matchingId) return;
    api.get(`/matchings/${matchingId}/sessions`).then(r => setSessions(r.data.data)).catch(() => {});
  };

  useEffect(() => {
    if (!matchingId) return;
    Promise.all([
      classroomService.getFeed(matchingId),
      classroomService.getPeople(matchingId),
      api.get(`/matchings/${matchingId}/sessions`),
    ]).then(([feedRes, peopleRes, sessRes]) => {
      setPosts(feedRes.data.data);
      setPeople(peopleRes.data.data);
      setSessions(sessRes.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [matchingId]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!matchingId) return null;

  const isPadawan = user?.rol === 'Padawan';
  const partnerName = isPadawan
    ? `${people?.mentor_nombres || ''} ${people?.mentor_apellidos || ''}`
    : `${people?.padawan_nombres || ''} ${people?.padawan_apellidos || ''}`;
  const aulaTitle = isPadawan ? `Mentoría con ${partnerName}` : `Aula — ${people?.padawan_nombres}`;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'novedades', label: 'Novedades', icon: '📢' },
    { key: 'trabajo', label: 'Trabajo en clase', icon: '📚' },
    { key: 'personas', label: 'Personas', icon: '👥' },
  ];

  return (
    <div className="animate-fade-in -mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
      {/* Banner */}
      <div className="relative p-6 pb-16" style={{ background: getGradient(matchingId), minHeight: '140px' }}>
        <Link to="/sessions" className="text-xs text-white/80 hover:text-white mb-2 inline-block">← Volver a Mis Aulas</Link>
        <h1 className="text-2xl font-bold text-white drop-shadow-sm mt-1">{aulaTitle}</h1>
        <p className="text-sm text-white/80 mt-0.5">
          {isPadawan ? '🧙‍♂️ Mentor Jedi' : '🧑‍🎓 Padawan'} · Afinidad {(Number(people?.score_afinidad || 0) * 100).toFixed(0)}%
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 -mt-6 relative z-10">
        <div className="card p-1 inline-flex gap-1 rounded-xl" style={{ boxShadow: 'var(--shadow-md)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t.key ? 'var(--color-primary-500)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--text-muted)',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        {tab === 'novedades' && <FeedTab matchingId={matchingId} posts={posts} reload={loadFeed} />}
        {tab === 'trabajo' && <WorkTab matchingId={matchingId} sessions={sessions} reload={loadSessions} />}
        {tab === 'personas' && <PeopleTab people={people} />}
      </div>

      {/* Chat */}
      <ChatWidget matchingId={matchingId} partnerName={partnerName} />
    </div>
  );
};

export default ClassroomPage;

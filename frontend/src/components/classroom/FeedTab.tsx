import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { classroomService } from '../../services/api';
import type { ClassroomPost } from '../../types';

const TIPO_ICONS: Record<string, string> = { anuncio: '📢', material: '📄', enlace: '🔗' };

const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s/60)} min`;
  if (s < 86400) return `hace ${Math.floor(s/3600)}h`;
  return new Date(d).toLocaleDateString('es-PE', { day:'numeric', month:'short' });
};

const Initials = ({ n, a, rol }: { n: string; a: string; rol: string }) => (
  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
       style={{ backgroundColor: rol === 'Jedi' ? 'var(--color-primary-100)' : 'var(--color-success-light)',
                color: rol === 'Jedi' ? 'var(--color-primary-700)' : 'var(--color-success-dark)' }}>
    {n[0]}{a[0]}
  </div>
);

export default function FeedTab({ matchingId, posts, reload }: { matchingId: string; posts: ClassroomPost[]; reload: () => void }) {
  const { user } = useAuth();
  const isJedi = user?.rol === 'Jedi';
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'anuncio'|'material'|'enlace'>('anuncio');
  const [postUrl, setPostUrl] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setSending(true);
    try {
      await classroomService.createPost(matchingId, {
        tipo: postType, contenido: newPost,
        ...(postUrl ? { url_enlace: postUrl } : {}),
      });
      setNewPost(''); setPostUrl(''); setExpanded(false); reload();
    } catch { /* */ } finally { setSending(false); }
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    try {
      await classroomService.addComment(postId, text);
      setCommentText(p => ({ ...p, [postId]: '' }));
      reload();
    } catch { /* */ }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* New post box */}
      <div className="card p-4" style={{ border: '1px solid var(--border-light)' }}>
        {!expanded ? (
          <div onClick={() => setExpanded(true)} className="flex items-center gap-3 cursor-pointer"
               style={{ color: 'var(--text-muted)' }}>
            <Initials n={user?.nombres||'?'} a={user?.apellidos||'?'} rol={user?.rol||''} />
            <span className="text-sm">Publica algo en el aula...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['anuncio','material','enlace'] as const).map(t => (
                <button key={t} onClick={() => setPostType(t)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                  style={{ backgroundColor: postType === t ? 'var(--color-primary-100)' : 'var(--surface-input)',
                           color: postType === t ? 'var(--color-primary-700)' : 'var(--text-muted)' }}>
                  {TIPO_ICONS[t]} {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
            <textarea className="input-field" rows={3} placeholder="Escribe aquí..."
                      value={newPost} onChange={e => setNewPost(e.target.value)} autoFocus />
            {(postType === 'enlace' || postType === 'material') && (
              <input className="input-field" placeholder="URL del enlace (opcional)"
                     value={postUrl} onChange={e => setPostUrl(e.target.value)} />
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setExpanded(false); setNewPost(''); }} className="btn-ghost text-xs">Cancelar</button>
              <button onClick={handlePost} disabled={sending || !newPost.trim()} className="btn-primary text-xs">
                {sending ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts feed */}
      {posts.map(post => (
        <div key={post.post_id} className="card p-0 overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
          {post.fijado && (
            <div className="px-4 py-1.5 text-xs font-medium flex items-center gap-1"
                 style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
              📌 Publicación fijada
            </div>
          )}
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Initials n={post.autor_nombres} a={post.autor_apellidos} rol={post.autor_rol} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {post.autor_nombres} {post.autor_apellidos}
                    <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: post.autor_rol==='Jedi'?'var(--color-primary-50)':'var(--color-success-light)',
                                   color: post.autor_rol==='Jedi'?'var(--color-primary-600)':'var(--color-success-dark)' }}>
                      {post.autor_rol==='Jedi'?'Mentor':'Estudiante'}
                    </span>
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(post.fecha_creacion)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isJedi && (
                  <button onClick={async () => { await classroomService.togglePin(post.post_id); reload(); }}
                    className="p-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
                    style={{ color: post.fijado ? 'var(--color-primary-500)' : 'var(--text-muted)' }}
                    title={post.fijado ? 'Desfijar' : 'Fijar'}>📌</button>
                )}
                {(post.autor_id === user?.usuario_id || isJedi) && (
                  <button onClick={async () => { await classroomService.deletePost(post.post_id); reload(); }}
                    className="p-1.5 rounded-lg text-xs" style={{ color: 'var(--color-danger)' }} title="Eliminar">🗑</button>
                )}
              </div>
            </div>

            {/* Content */}
            {post.titulo && <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{post.titulo}</p>}
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{post.contenido}</p>

            {/* URL */}
            {post.url_enlace && (
              <a href={post.url_enlace} target="_blank" rel="noopener noreferrer"
                 className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                 style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)', border: '1px solid var(--color-primary-100)' }}>
                🔗 {post.url_enlace.length > 50 ? post.url_enlace.slice(0,50)+'...' : post.url_enlace}
              </a>
            )}

            {/* Resources */}
            {post.recursos && post.recursos.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {post.recursos.map(r => (
                  <a key={r.recurso_id} href={r.url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 p-2 rounded-lg text-xs hover:opacity-80 transition-all"
                     style={{ backgroundColor: 'var(--surface-input)', color: 'var(--text-secondary)' }}>
                    {r.tipo === 'github' ? '🐙' : r.tipo === 'video' ? '🎬' : '📎'} {r.nombre}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={{ borderTop: '1px solid var(--border-light)' }}>
            <button onClick={() => setShowComments(p => ({...p, [post.post_id]: !p[post.post_id]}))}
              className="w-full px-4 py-2 text-xs text-left font-medium" style={{ color: 'var(--text-muted)' }}>
              💬 {post.comentarios?.length || 0} comentarios
            </button>
            {showComments[post.post_id] && (
              <div className="px-4 pb-3 space-y-2">
                {post.comentarios?.map(c => (
                  <div key={c.comentario_id} className="flex gap-2">
                    <Initials n={c.autor_nombres} a={c.autor_apellidos} rol={c.autor_rol} />
                    <div className="flex-1 p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--surface-input)' }}>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.autor_nombres}</span>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{c.contenido}</span>
                      <p className="mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{timeAgo(c.fecha_creacion)}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  <input className="input-field flex-1 text-xs" placeholder="Escribe un comentario..."
                    value={commentText[post.post_id]||''} onChange={e => setCommentText(p => ({...p,[post.post_id]:e.target.value}))}
                    onKeyDown={e => e.key==='Enter' && handleComment(post.post_id)} />
                  <button onClick={() => handleComment(post.post_id)} className="btn-primary text-xs px-3">Enviar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/api';
import type { ChatMessage } from '../../types';

export default function ChatWidget({ matchingId, partnerName }: { matchingId: string; partnerName: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    chatService.getMessages(matchingId).then(r => { setMessages(r.data.data); setUnread(0); }).catch(() => {});
  };

  const loadUnread = () => {
    if (!open) chatService.getUnreadCount(matchingId).then(r => setUnread(r.data.data.unread)).catch(() => {});
  };

  useEffect(() => { loadUnread(); const i = setInterval(loadUnread, 10000); return () => clearInterval(i); }, [open]);
  useEffect(() => { if (open) { loadMessages(); const i = setInterval(loadMessages, 5000); return () => clearInterval(i); } }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try { await chatService.sendMessage(matchingId, text); setText(''); loadMessages(); }
    catch { /* */ } finally { setSending(false); }
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-40 transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
        <span className="text-2xl text-white">{open ? '✕' : '💬'}</span>
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--color-danger)' }}>{unread}</span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 rounded-2xl overflow-hidden z-40 animate-slide-up"
             style={{ backgroundColor: 'var(--surface-card)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', border: '1px solid var(--border-light)', height: '420px', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="p-3 flex items-center gap-2"
               style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                 style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {partnerName.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{partnerName}</p>
              <p className="text-xs text-white/70">Chat directo</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ backgroundColor: 'var(--surface-main)' }}>
            {messages.length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                Envía tu primer mensaje 👋
              </p>
            )}
            {messages.map(m => {
              const isMine = m.emisor_id === user?.usuario_id;
              return (
                <div key={m.mensaje_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%] px-3 py-2 rounded-2xl text-xs"
                       style={{
                         backgroundColor: isMine ? 'var(--color-primary-500)' : 'var(--surface-card)',
                         color: isMine ? '#fff' : 'var(--text-primary)',
                         borderBottomRightRadius: isMine ? '4px' : undefined,
                         borderBottomLeftRadius: !isMine ? '4px' : undefined,
                         border: isMine ? 'none' : '1px solid var(--border-light)',
                       }}>
                    <p>{m.contenido}</p>
                    <p className="mt-0.5 text-right" style={{ fontSize: '9px', opacity: 0.7 }}>
                      {new Date(m.fecha_envio).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-2 flex gap-2" style={{ borderTop: '1px solid var(--border-light)' }}>
            <input className="input-field flex-1 text-xs" placeholder="Escribe un mensaje..."
                   value={text} onChange={e => setText(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend} disabled={sending || !text.trim()}
                    className="btn-primary text-xs px-3 rounded-xl">➤</button>
          </div>
        </div>
      )}
    </>
  );
}

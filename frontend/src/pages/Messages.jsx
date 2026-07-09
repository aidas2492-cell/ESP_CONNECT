import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useDMSocket } from '../api/dmSocket';
import NewConversationModal from '../components/NewConversationModal';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get('c') ? Number(searchParams.get('c')) : null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef(null);

  const chargerConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data.conversations || []);
    } catch {
      /* silencieux */
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => { chargerConversations(); }, []);

  useEffect(() => {
    if (!activeId) return;
    setSearchParams({ c: String(activeId) });
    api.get(`/messages/conversations/${activeId}/messages`).then(({ data }) => setMessages(data.messages || [])).catch(() => setMessages([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useDMSocket((payload) => {
    if (payload.conversationId === activeId) {
      setMessages((prev) => [...prev, payload.message]);
    }
    chargerConversations();
  });

  const envoyer = async (e) => {
    e.preventDefault();
    if (!texte.trim() || !activeId) return;
    const contenu = texte.trim();
    setTexte('');
    try {
      await api.post(`/messages/conversations/${activeId}/messages`, { contenu });
    } catch {
      /* silencieux */
    }
  };

  const conversationActive = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="card overflow-hidden flex h-[75vh]">
        {/* Liste des conversations */}
        <div className={`w-full sm:w-80 shrink-0 border-r border-gray-100 dark:border-gray-700 flex flex-col ${activeId ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900 dark:text-white">Messages</h2>
            <button onClick={() => setShowNew(true)} className="btn-primary !px-3 !py-1.5 text-xs">+ Nouveau</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs && <p className="text-center text-sm text-gray-400 mt-8">...</p>}
            {!loadingConvs && conversations.length === 0 && (
              <p className="text-center text-sm text-gray-400 mt-8 px-4">Aucune conversation. Lancez une discussion avec un membre ou créez un groupe !</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-gray-700/50 transition ${activeId === c.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-bold text-sm overflow-hidden">
                  {c.image ? <img src={c.image} className="h-full w-full object-cover" alt="" /> : (c.type === 'group' ? '👥' : c.nom?.[0])}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.nom || 'Conversation'}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {c.dernierMessage ? `${c.dernierMessage.auteur}: ${c.dernierMessage.contenu}` : 'Aucun message'}
                  </p>
                </div>
                {c.nonLu && <span className="h-2.5 w-2.5 rounded-full bg-primary-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Fenêtre de discussion */}
        <div className={`flex-1 flex-col ${activeId ? 'flex' : 'hidden sm:flex'}`}>
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Sélectionnez une conversation pour commencer à discuter.
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <button onClick={() => setActiveId(null)} className="sm:hidden text-gray-400">←</button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-bold text-xs overflow-hidden">
                  {conversationActive?.image ? <img src={conversationActive.image} className="h-full w-full object-cover" alt="" /> : (conversationActive?.type === 'group' ? '👥' : conversationActive?.nom?.[0])}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{conversationActive?.nom}</p>
                  {conversationActive?.type === 'group' && (
                    <p className="text-xs text-gray-400">{conversationActive.participants?.length} membres</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((m) => {
                  const mine = m.auteur?.id === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'}`}>
                        {!mine && conversationActive?.type === 'group' && (
                          <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-300 mb-0.5">{m.auteur?.prenom}</p>
                        )}
                        <p>{m.contenu}</p>
                        <p className={`text-[10px] mt-1 ${mine ? 'text-primary-100' : 'text-gray-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={envoyer} className="border-t border-gray-100 dark:border-gray-700 p-3 flex gap-2">
                <input className="input flex-1" placeholder="Écrire un message..." value={texte} onChange={(e) => setTexte(e.target.value)} />
                <button type="submit" className="btn-primary !px-4">Envoyer</button>
              </form>
            </>
          )}
        </div>
      </div>

      <NewConversationModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(id) => {
          setShowNew(false);
          chargerConversations().then(() => setActiveId(id));
        }}
      />
    </div>
  );
}

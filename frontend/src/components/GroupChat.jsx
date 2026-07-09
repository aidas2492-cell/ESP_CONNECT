import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axiosInstance';
import { useGroupSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function GroupChat({ structureId }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/structures/${structureId}/messages`);
        setMessages(data.messages || []);
      } catch {
        /* réservé aux membres : géré par le rendu conditionnel côté parent */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [structureId]);

  useGroupSocket(
    structureId,
    (msg) => setMessages((prev) => [...prev, msg]),
    ({ prenom }) => {
      setTypingUser(prenom);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
    }
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const envoyer = async (e) => {
    e.preventDefault();
    if (!texte.trim()) return;
    try {
      await api.post(`/structures/${structureId}/messages`, { contenu: texte.trim() });
      setTexte('');
    } catch {
      /* le message ne sera pas envoyé silencieusement en cas d'erreur réseau */
    }
  };

  return (
    <div className="card flex flex-col h-[480px]">
      <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <h3 className="font-display font-semibold text-gray-900 dark:text-white text-sm">{t('tab_messages')}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-gray-400 text-center mt-10">...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-10">Aucun message pour l’instant. Lancez la discussion !</p>
        ) : (
          messages.map((m) => {
            const mine = m.auteur?.id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                }`}>
                  {!mine && (
                    <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-300 mb-0.5">
                      {m.auteur?.prenom} {m.auteur?.nom}
                    </p>
                  )}
                  <p>{m.contenu}</p>
                  <p className={`text-[10px] mt-1 ${mine ? 'text-primary-100' : 'text-gray-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {typingUser && <p className="text-xs italic text-gray-400">{typingUser} écrit...</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={envoyer} className="border-t border-gray-100 dark:border-gray-700 p-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Écrire un message..."
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
        />
        <button type="submit" className="btn-primary !px-4">{t('btn_send')}</button>
      </form>
    </div>
  );
}

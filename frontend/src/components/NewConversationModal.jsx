import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

export default function NewConversationModal({ open, onClose, onCreated }) {
  const [mode, setMode] = useState('direct'); // 'direct' | 'group'
  const [search, setSearch] = useState('');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [selection, setSelection] = useState([]);
  const [nomGroupe, setNomGroupe] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      api.get('/messages/utilisateurs', { params: { search } }).then(({ data }) => setUtilisateurs(data.utilisateurs || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [search, open]);

  if (!open) return null;

  const toggleSelection = (user) => {
    setSelection((prev) => (prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]));
  };

  const demarrerDirect = async (user) => {
    setEnvoi(true);
    try {
      const { data } = await api.post('/messages/conversations/direct', { userId: user.id });
      onCreated?.(data.conversation.id);
    } finally {
      setEnvoi(false);
    }
  };

  const creerGroupe = async () => {
    if (!nomGroupe.trim() || selection.length === 0) return;
    setEnvoi(true);
    try {
      const { data } = await api.post('/messages/conversations/group', {
        nom: nomGroupe.trim(),
        memberIds: selection.map((u) => u.id),
      });
      onCreated?.(data.conversation.id);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl animate-slide-up flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">Nouvelle conversation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex gap-2 px-6 pt-4">
          <button onClick={() => setMode('direct')} className={`flex-1 rounded-lg py-2 text-sm font-medium ${mode === 'direct' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            💬 Message direct
          </button>
          <button onClick={() => setMode('group')} className={`flex-1 rounded-lg py-2 text-sm font-medium ${mode === 'group' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            👥 Créer un groupe
          </button>
        </div>

        {mode === 'group' && (
          <div className="px-6 pt-4">
            <input
              className="input"
              placeholder="Nom du groupe"
              value={nomGroupe}
              onChange={(e) => setNomGroupe(e.target.value)}
            />
            {selection.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selection.map((u) => (
                  <span key={u.id} className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    {u.prenom} ✕
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-6 pt-4">
          <input
            className="input"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {utilisateurs.map((u) => {
            const selectionne = selection.some((s) => s.id === u.id);
            return (
              <button
                key={u.id}
                onClick={() => (mode === 'direct' ? demarrerDirect(u) : toggleSelection(u))}
                disabled={envoi}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${selectionne ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-bold text-xs overflow-hidden">
                  {u.photo ? <img src={u.photo} className="h-full w-full object-cover" alt="" /> : u.prenom?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{u.prenom} {u.nom}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                {mode === 'group' && (
                  <div className={`ml-auto h-5 w-5 rounded-full border-2 ${selectionne ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600'}`} />
                )}
              </button>
            );
          })}
        </div>

        {mode === 'group' && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <button onClick={creerGroupe} disabled={envoi || !nomGroupe.trim() || selection.length === 0} className="btn-primary w-full">
              {envoi ? '...' : `Créer le groupe (${selection.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

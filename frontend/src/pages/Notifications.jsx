import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = [
  { key: 'toutes', label: 'Toutes', icon: '🔔' },
  { key: 'mention', label: 'Mentions', icon: '@' },
  { key: 'reaction', label: 'Réactions', icon: '👍' },
  { key: 'invitation', label: 'Invitations', icon: '🤝' },
  { key: 'general', label: 'Général', icon: '📌' },
];

export default function Notifications() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [compteurs, setCompteurs] = useState({});
  const [categorie, setCategorie] = useState('toutes');
  const [loading, setLoading] = useState(true);

  const load = async (cat = categorie) => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { categorie: cat } });
      setNotifications(data.notifications || []);
      setCompteurs(data.compteurParCategorie || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(categorie); /* eslint-disable-next-line */ }, [categorie]);

  const marquerLue = async (id) => {
    await api.put(`/notifications/${id}/lue`);
    load();
  };

  const toutMarquer = async () => {
    await api.put('/notifications/tout-lire');
    load();
  };

  const totalNonLues = Object.values(compteurs).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t('nav_notifications')}</h1>
        {totalNonLues > 0 && (
          <button onClick={toutMarquer} className="text-sm font-semibold text-primary-600 hover:underline">Tout marquer comme lu</button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategorie(c.key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition ${
              categorie === c.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <span>{c.icon}</span> {c.label}
            {c.key !== 'toutes' && compteurs[c.key] > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 text-xs ${categorie === c.key ? 'bg-white/20' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'}`}>
                {compteurs[c.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Aucune notification pour le moment.</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={`card p-4 flex gap-3 items-start ${!n.lue ? 'border-l-4 border-l-primary-600' : ''}`}>
              <span className="text-xl">{n.lue ? '📭' : '📬'}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{n.titre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.date_envoie).toLocaleString('fr-FR')}</p>
                {n.lien && <Link to={n.lien} className="text-xs font-semibold text-primary-600 hover:underline">Voir →</Link>}
              </div>
              {!n.lue && (
                <button onClick={() => marquerLue(n.id)} className="text-xs text-gray-400 hover:text-primary-600 shrink-0">Marquer lu</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

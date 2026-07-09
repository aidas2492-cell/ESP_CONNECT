import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useLanguage } from '../context/LanguageContext';

export default function Notifications() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const marquerLue = async (id) => {
    await api.put(`/notifications/${id}/lue`);
    load();
  };

  const toutMarquer = async () => {
    await api.put('/notifications/tout-lire');
    load();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t('nav_notifications')}</h1>
        {notifications.some((n) => !n.lue) && (
          <button onClick={toutMarquer} className="text-sm font-semibold text-primary-600 hover:underline">Tout marquer comme lu</button>
        )}
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

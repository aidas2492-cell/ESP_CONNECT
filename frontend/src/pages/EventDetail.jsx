import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import Countdown from '../components/Countdown';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent(data.evenement);
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const participer = async () => {
    setParticipating(true);
    try {
      const { data } = await api.post(`/events/${id}/participer`);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    } finally {
      setParticipating(false);
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  if (!event) return <div className="text-center py-24 text-gray-400">Événement introuvable.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="card overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-gray-700 to-gray-900 relative">
          {event.image ? <img src={event.image} alt={event.titre} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl">📅</div>}
        </div>
        <div className="p-8">
          <Link to={`/structures/${event.structure?.id}`} className="text-sm font-semibold text-primary-600 hover:underline">
            {event.structure?.nom}
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">{event.titre}</h1>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>📍 {event.lieu}</span>
            <span>🗓️ {new Date(event.date_debut).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</span>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">{t('countdown_ends_in')}</p>
            <Countdown targetDate={event.date_debut} />
          </div>

          <p className="mt-6 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p>

          <div className="mt-8">
            {user ? (
              <button onClick={participer} disabled={participating} className="btn-primary">
                {participating ? '...' : 'Participer à cet événement'}
              </button>
            ) : (
              <Link to="/connexion" state={{ from: `/evenements/${id}` }} className="btn-primary">
                {t('nav_login')} pour participer
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axiosInstance';
import EventCard from '../components/EventCard';
import Pagination from '../components/Pagination';
import { useLanguage } from '../context/LanguageContext';

const PAGE_SIZE = 9;

export default function Events() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [aVenir, setAVenir] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/events', { params: { a_venir: aVenir } });
        setEvents(data.evenements || []);
        setPage(1);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [aVenir]);

  const filtered = useMemo(
    () => events.filter((e) => e.titre.toLowerCase().includes(search.toLowerCase()) || e.structure?.nom.toLowerCase().includes(search.toLowerCase())),
    [events, search]
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{t('home_events_title')}</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input className="input pl-9" placeholder="Rechercher un événement..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" checked={aVenir} onChange={(e) => setAVenir(e.target.checked)} className="accent-primary-600" />
          À venir uniquement
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-56 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Aucun événement trouvé.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((ev) => <EventCard key={ev.id} event={ev} />)}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

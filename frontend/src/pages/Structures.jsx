import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axiosInstance';
import StructureCard from '../components/StructureCard';
import Pagination from '../components/Pagination';
import { useLanguage } from '../context/LanguageContext';

const TYPES = ['club', 'amicale_etudiants', 'amicale_personnel', 'commission_sociale'];
const PAGE_SIZE = 9;

export default function Structures() {
  const { t } = useLanguage();
  const [structures, setStructures] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/structures', { params: { search, type } });
        setStructures(data.structures || []);
        setPage(1);
      } catch {
        setStructures([]);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, type]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return structures.slice(start, start + PAGE_SIZE);
  }, [structures, page]);

  const totalPages = Math.ceil(structures.length / PAGE_SIZE) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{t('home_structures_title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('home_structures_subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            className="input pl-9"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-56" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t('filter_all_types')}</option>
          {TYPES.map((tp) => (
            <option key={tp} value={tp}>{t(`type_${tp}`)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Aucune structure ne correspond à votre recherche.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((s) => (
              <StructureCard key={s.id} structure={s} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

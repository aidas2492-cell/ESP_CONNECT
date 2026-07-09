import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const typeColors = {
  club: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  amicale_etudiants: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  amicale_personnel: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  commission_sociale: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

export default function StructureCard({ structure }) {
  const { t } = useLanguage();

  return (
    <Link
      to={`/structures/${structure.id}`}
      className="card group overflow-hidden flex flex-col h-full"
    >
      <div className="h-36 w-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 relative">
        {structure.logo ? (
          <img
            src={structure.logo}
            alt={structure.nom}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-display font-bold text-white/90">
            {structure.nom?.[0]}
          </div>
        )}
        <span className={`absolute top-3 left-3 badge ${typeColors[structure.type] || typeColors.club}`}>
          {t(`type_${structure.type}`)}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-semibold text-gray-900 dark:text-white line-clamp-1">{structure.nom}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{structure.description}</p>
        <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
          <span>👥 {structure.nombre_membres ?? 0} membres</span>
          <span className="font-semibold text-primary-600 group-hover:underline">{t('btn_view')} →</span>
        </div>
      </div>
    </Link>
  );
}

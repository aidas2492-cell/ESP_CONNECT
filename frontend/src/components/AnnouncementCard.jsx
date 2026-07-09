import React from 'react';
import Countdown from './Countdown';
import { useLanguage } from '../context/LanguageContext';

export default function AnnouncementCard({ annonce }) {
  const { t } = useLanguage();
  return (
    <div className="card p-5 flex flex-col gap-3 shrink-0 w-80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary-600">{annonce.structure?.nom}</span>
        <span className="text-xs text-gray-400">
          {new Date(annonce.date_publication).toLocaleDateString('fr-FR')}
        </span>
      </div>
      <h3 className="font-display font-semibold text-gray-900 dark:text-white line-clamp-1">{annonce.titre}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{annonce.contenu}</p>
      {annonce.date_echeance && (
        <div className="pt-1">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">{t('countdown_ends_in')}</p>
          <Countdown targetDate={annonce.date_echeance} />
        </div>
      )}
    </div>
  );
}

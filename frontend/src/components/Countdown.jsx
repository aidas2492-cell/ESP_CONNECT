import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const getTimeLeft = (targetDate) => {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

export default function Countdown({ targetDate, compact = false }) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <span className="badge bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {t('countdown_ended')}
      </span>
    );
  }

  if (compact) {
    return (
      <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-mono">
        {timeLeft.days}{t('countdown_days')} {timeLeft.hours}{t('countdown_hours')} {timeLeft.minutes}{t('countdown_minutes')}
      </span>
    );
  }

  const units = [
    { value: timeLeft.days, label: t('countdown_days') },
    { value: timeLeft.hours, label: t('countdown_hours') },
    { value: timeLeft.minutes, label: t('countdown_minutes') },
    { value: timeLeft.seconds, label: t('countdown_seconds') },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center rounded-lg bg-primary-600 text-white px-2 py-1 min-w-[42px]">
          <span className="text-sm font-bold font-mono leading-none">{String(u.value).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wide opacity-80">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

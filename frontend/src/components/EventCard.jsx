import React from 'react';
import { Link } from 'react-router-dom';
import Countdown from './Countdown';

export default function EventCard({ event }) {
  return (
    <Link to={`/evenements/${event.id}`} className="card overflow-hidden flex flex-col h-full">
      <div className="h-32 w-full overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 relative">
        {event.image ? (
          <img src={event.image} alt={event.titre} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">📅</div>
        )}
        <div className="absolute bottom-2 left-2">
          <Countdown targetDate={event.date_debut} compact />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-primary-600">{event.structure?.nom}</p>
        <h3 className="font-display font-semibold text-gray-900 dark:text-white line-clamp-1">{event.titre}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          📍 {event.lieu} · {new Date(event.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </Link>
  );
}

import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

export default function MembresEnVueWidget() {
  const [membres, setMembres] = useState([]);

  useEffect(() => {
    api.get('/feed/meta/membres-en-vue').then(({ data }) => setMembres(data.membres || [])).catch(() => {});
  }, []);

  if (membres.length === 0) return null;

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        ✨ Membres à l'honneur
      </h3>
      <div className="space-y-4">
        {membres.map((m) => (
          <div key={m.utilisateur.id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-bold text-sm overflow-hidden">
              {m.utilisateur.photo ? <img src={m.utilisateur.photo} className="h-full w-full object-cover" alt="" /> : m.utilisateur.prenom?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.utilisateur.prenom} {m.utilisateur.nom}</p>
              <p className="text-xs text-gray-400">{m.points} points d'activité</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-3">Classement basé sur les publications et likes reçus sur la plateforme.</p>
    </div>
  );
}

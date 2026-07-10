import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from './VerifiedBadge';

export default function ProfileSummaryCard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="card overflow-hidden">
      <div className="h-14 bg-gradient-to-br from-primary-600 to-primary-900" />
      <div className="px-4 pb-4 -mt-7">
        <Link to="/profil/moi" className="block h-14 w-14 rounded-xl border-4 border-white dark:border-gray-800 bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 overflow-hidden">
          {user.photo ? <img src={user.photo} className="h-full w-full object-cover" alt="" /> : `${user.prenom?.[0]}${user.nom?.[0]}`}
        </Link>
        <Link to="/profil/moi" className="mt-2 flex items-center gap-1 font-semibold text-sm text-gray-900 dark:text-white hover:underline">
          {user.prenom} {user.nom} {user.verifie && <VerifiedBadge />}
        </Link>
        {user.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.bio}</p>}

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <Link to="/reseau" className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600">
            <span>Mon réseau</span> <span>→</span>
          </Link>
          <Link to="/tableau-de-bord" className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600">
            <span>Mes structures</span> <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

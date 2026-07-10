import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import VerifiedBadge from './VerifiedBadge';

export default function SuggestionsWidget() {
  const { showToast } = useToast();
  const [suggestions, setSuggestions] = useState([]);
  const [envoyees, setEnvoyees] = useState(new Set());

  useEffect(() => {
    api.get('/connexions/suggestions').then(({ data }) => setSuggestions((data.suggestions || []).slice(0, 4))).catch(() => {});
  }, []);

  const envoyerDemande = async (userId) => {
    setEnvoyees((prev) => new Set(prev).add(userId));
    try {
      await api.post('/connexions', { userId });
      showToast('Demande envoyée.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur.', 'error');
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Personnes que vous pourriez connaître</h3>
      <div className="space-y-4">
        {suggestions.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <Link to={`/profil/${s.id}`} className="h-10 w-10 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 overflow-hidden">
              {s.photo ? <img src={s.photo} className="h-full w-full object-cover" alt="" /> : s.prenom?.[0]}
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/profil/${s.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:underline truncate flex items-center gap-1">
                {s.prenom} {s.nom} {s.verifie && <VerifiedBadge />}
              </Link>
              <p className="text-xs text-gray-400 truncate">{s.bio || 'Membre ESPConnect'}</p>
            </div>
            <button onClick={() => envoyerDemande(s.id)} disabled={envoyees.has(s.id)} className="btn-secondary !px-2.5 !py-1 text-xs shrink-0">
              {envoyees.has(s.id) ? '✓' : '+'}
            </button>
          </div>
        ))}
      </div>
      <Link to="/reseau" className="block text-center text-xs font-semibold text-primary-600 hover:underline mt-4">Voir plus →</Link>
    </div>
  );
}

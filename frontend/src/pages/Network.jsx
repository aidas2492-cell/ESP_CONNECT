import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import VerifiedBadge from '../components/VerifiedBadge';

const PersonCard = ({ personne, children }) => (
  <div className="card p-4 flex items-center gap-3">
    <Link to={`/profil/${personne.id}`} className="h-12 w-12 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 overflow-hidden">
      {personne.photo ? <img src={personne.photo} className="h-full w-full object-cover" alt="" /> : personne.prenom?.[0]}
    </Link>
    <div className="flex-1 min-w-0">
      <Link to={`/profil/${personne.id}`} className="font-semibold text-sm text-gray-900 dark:text-white hover:underline flex items-center gap-1">
        {personne.prenom} {personne.nom} {personne.verifie && <VerifiedBadge />}
      </Link>
      {personne.bio && <p className="text-xs text-gray-400 truncate">{personne.bio}</p>}
    </div>
    <div className="flex gap-2 shrink-0">{children}</div>
  </div>
);

export default function Network() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('suggestions');
  const [suggestions, setSuggestions] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [connexions, setConnexions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envoyees, setEnvoyees] = useState(new Set());

  const chargerTout = async () => {
    setLoading(true);
    try {
      const [sRes, dRes, cRes] = await Promise.all([
        api.get('/connexions/suggestions'),
        api.get('/connexions/demandes'),
        api.get('/connexions'),
      ]);
      setSuggestions(sRes.data.suggestions || []);
      setDemandes(dRes.data.demandes || []);
      setConnexions(cRes.data.connexions || []);
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerTout(); }, []);

  const envoyerDemande = async (userId) => {
    setEnvoyees((prev) => new Set(prev).add(userId));
    try {
      await api.post('/connexions', { userId });
      showToast('Demande envoyée.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur.', 'error');
    }
  };

  const traiter = async (id, decision) => {
    try {
      await api.put(`/connexions/${id}`, { decision });
      showToast(decision === 'accepter' ? 'Connexion acceptée.' : 'Demande refusée.', 'success');
      chargerTout();
    } catch {
      showToast('Erreur.', 'error');
    }
  };

  const tabs = [
    { key: 'suggestions', label: 'Suggestions', count: suggestions.length },
    { key: 'demandes', label: 'Demandes reçues', count: demandes.length },
    { key: 'connexions', label: 'Mes connexions', count: connexions.length },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6">Mon réseau</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t.label} {t.count > 0 && <span className="text-xs opacity-80">({t.count})</span>}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-gray-400 text-sm">...</p>}

      {!loading && tab === 'suggestions' && (
        <div className="space-y-3">
          {suggestions.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Aucune suggestion pour le moment. Rejoignez des structures pour trouver des membres à connaître.</p>}
          {suggestions.map((s) => (
            <PersonCard key={s.id} personne={s}>
              <button onClick={() => envoyerDemande(s.id)} disabled={envoyees.has(s.id)} className="btn-secondary !px-3 !py-1.5 text-xs">
                {envoyees.has(s.id) ? 'Envoyée' : '+ Se connecter'}
              </button>
            </PersonCard>
          ))}
        </div>
      )}

      {!loading && tab === 'demandes' && (
        <div className="space-y-3">
          {demandes.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Aucune demande en attente.</p>}
          {demandes.map((d) => (
            <PersonCard key={d.id} personne={d.demandeur}>
              <button onClick={() => traiter(d.id, 'accepter')} className="btn-primary !px-3 !py-1.5 text-xs">Accepter</button>
              <button onClick={() => traiter(d.id, 'refuser')} className="btn-secondary !px-3 !py-1.5 text-xs">Refuser</button>
            </PersonCard>
          ))}
        </div>
      )}

      {!loading && tab === 'connexions' && (
        <div className="space-y-3">
          {connexions.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Vous n'avez pas encore de connexions.</p>}
          {connexions.map((c) => (
            <PersonCard key={c.id} personne={c}>
              <Link to={`/profil/${c.id}`} className="btn-secondary !px-3 !py-1.5 text-xs">Voir le profil</Link>
            </PersonCard>
          ))}
        </div>
      )}
    </div>
  );
}

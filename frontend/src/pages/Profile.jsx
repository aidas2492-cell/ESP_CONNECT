import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import VerifiedBadge from '../components/VerifiedBadge';
import Modal from '../components/Modal';

export default function Profile() {
  const { id } = useParams();
  const { user: moi, updateLocalUser, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  if (id === 'moi' && !authLoading && !moi) {
    return <Navigate to="/connexion" replace />;
  }

  const estMonProfil = id === 'moi' || (moi && parseInt(id) === moi.id);
  const profilId = estMonProfil ? moi?.id : id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ bio: '', a_propos: '', promotion: '', competences: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!profilId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/profil/${profilId}`);
      setData(data);
      setForm({
        bio: data.user.bio || '',
        a_propos: data.user.a_propos || '',
        promotion: data.user.promotion || '',
        competences: (data.user.competences || []).join(', '),
      });
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [profilId]);

  const enregistrer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: res } = await api.put('/profil', {
        bio: form.bio,
        a_propos: form.a_propos,
        promotion: form.promotion,
        competences: form.competences.split(',').map((c) => c.trim()).filter(Boolean),
      });
      updateLocalUser({ ...moi, ...res.user });
      showToast('Profil mis à jour.', 'success');
      setEditOpen(false);
      load();
    } catch {
      showToast('Erreur lors de la mise à jour.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const gererConnexion = async () => {
    try {
      if (data.statutConnexion === 'aucune') {
        await api.post('/connexions', { userId: profilId });
        showToast('Demande de connexion envoyée.', 'success');
      } else if (data.statutConnexion === 'demande_recue') {
        await api.put(`/connexions/${data.connexionId}`, { decision: 'accepter' });
        showToast('Connexion acceptée.', 'success');
      }
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur.', 'error');
    }
  };

  if (loading || !data) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  }

  const { user, structures, statutConnexion, nombreConnexions } = data;

  const boutonConnexion = () => {
    if (estMonProfil) return null;
    const labels = {
      aucune: '+ Se connecter',
      demande_envoyee: 'Demande envoyée',
      demande_recue: 'Accepter la demande',
      connecte: '✓ Connecté(e)',
    };
    return (
      <button
        onClick={gererConnexion}
        disabled={statutConnexion === 'demande_envoyee' || statutConnexion === 'connecte'}
        className="btn-primary"
      >
        {labels[statutConnexion]}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="card overflow-hidden">
        <div className="h-40 sm:h-56 bg-gradient-to-br from-primary-600 to-primary-900 relative">
          {user.photo_couverture && <img src={user.photo_couverture} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12">
            <div className="h-24 w-24 rounded-2xl border-4 border-white dark:border-gray-800 bg-primary-100 dark:bg-primary-900/40 overflow-hidden flex items-center justify-center text-2xl font-bold text-primary-700 dark:text-primary-300">
              {user.photo ? <img src={user.photo} alt="" className="h-full w-full object-cover" /> : `${user.prenom?.[0]}${user.nom?.[0]}`}
            </div>
            <div className="pb-1">
              {estMonProfil ? (
                <button onClick={() => setEditOpen(true)} className="btn-secondary">✏️ Modifier le profil</button>
              ) : boutonConnexion()}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {user.prenom} {user.nom} {user.verifie && <VerifiedBadge size="lg" />}
            </h1>
            {user.bio && <p className="text-gray-600 dark:text-gray-300 mt-1">{user.bio}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
              {user.promotion && <span>🎓 {user.promotion}</span>}
              <span>🔗 {nombreConnexions} connexion{nombreConnexions !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {user.a_propos && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-2">À propos</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{user.a_propos}</p>
            </div>
          )}

          {user.competences?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Compétences</h2>
              <div className="flex flex-wrap gap-2">
                {user.competences.map((c) => (
                  <span key={c} className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{c}</span>
                ))}
              </div>
            </div>
          )}

          {structures.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Structures</h2>
              <div className="space-y-2">
                {structures.map((s) => (
                  <Link key={s.id} to={`/structures/${s.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="h-9 w-9 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300 overflow-hidden">
                      {s.logo ? <img src={s.logo} className="h-full w-full object-cover" alt="" /> : s.nom?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{s.nom}</p>
                      <p className="text-xs text-gray-400">{s.role_structure === 'president' ? 'Président' : 'Membre'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={editOpen} title="Modifier mon profil" onClose={() => setEditOpen(false)} onConfirm={enregistrer} confirmLabel={saving ? '...' : 'Enregistrer'}>
        <form onSubmit={enregistrer} className="space-y-3 text-left">
          <div>
            <label className="label">Titre (ex: Étudiant en Génie Informatique @ ESP)</label>
            <input className="input" maxLength={160} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div>
            <label className="label">À propos</label>
            <textarea rows={4} className="input" value={form.a_propos} onChange={(e) => setForm({ ...form, a_propos: e.target.value })} />
          </div>
          <div>
            <label className="label">Promotion (ex: 2024CSED)</label>
            <input className="input" value={form.promotion} onChange={(e) => setForm({ ...form, promotion: e.target.value })} />
          </div>
          <div>
            <label className="label">Compétences (séparées par des virgules)</label>
            <input className="input" placeholder="React, Gestion de projet, ..." value={form.competences} onChange={(e) => setForm({ ...form, competences: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

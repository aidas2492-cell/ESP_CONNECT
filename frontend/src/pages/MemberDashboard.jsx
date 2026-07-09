import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';

const TYPES = ['club', 'amicale_etudiants', 'amicale_personnel', 'commission_sociale'];

export default function MemberDashboard() {
  const { user, updateLocalUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [adhesions, setAdhesions] = useState([]);
  const [cotisations, setCotisations] = useState([]);
  const [payingCotisation, setPayingCotisation] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newStructure, setNewStructure] = useState({ nom: '', description: '', type: 'club' });
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState({ nom: user?.nom || '', prenom: user?.prenom || '', telephone: user?.telephone || '' });
  const [peutCreer, setPeutCreer] = useState({ peutCreer: false, raison: null });

  const loadAll = async () => {
    try {
      const [statsRes, mesRes, cotRes, peutCreerRes] = await Promise.all([
        api.get('/stats/membre'),
        api.get('/structures/mes-structures'),
        api.get('/cotisations', { params: { mine: true } }),
        api.get('/structures/peut-creer'),
      ]);
      setStats(statsRes.data);
      setAdhesions(mesRes.data.adhesions || []);
      setCotisations(cotRes.data.cotisations || []);
      setPeutCreer(peutCreerRes.data);
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => { loadAll(); }, []);

  const items = [
    { key: 'overview', icon: '📊', labelKey: 'tab_overview' },
    { key: 'structures', icon: '🏛️', labelKey: 'tab_structures' },
    { key: 'cotisations', icon: '💳', labelKey: 'tab_cotisations', badge: stats?.cotisationsEnAttente },
    { key: 'profile', icon: '⚙️', labelKey: 'tab_profile' },
  ];

  const creerStructure = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/structures', newStructure);
      showToast('Structure créée ! Vous en êtes le président.', 'success');
      setCreateOpen(false);
      navigate(`/president/${data.structure.id}`);
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const enregistrerProfil = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/me', profile);
      updateLocalUser(data.user);
      showToast('Profil mis à jour.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-primary-100 text-xs font-semibold uppercase tracking-wide mb-1">🎓 Espace Membre</p>
          <h1 className="font-display text-2xl font-bold text-white">{t('dashboard_member_title')}</h1>
          <p className="text-primary-100/80 text-sm">Bienvenue, {user?.prenom} 👋</p>
        </div>
        {peutCreer.peutCreer && (
          <button onClick={() => setCreateOpen(true)} className="btn-primary !bg-white !text-primary-700 hover:!bg-primary-50">+ {t('btn_create_structure')}</button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Sidebar items={items} active={tab} onSelect={setTab} />

        <div className="flex-1 space-y-6">
          {tab === 'overview' && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('stat_my_structures')} value={stats.structuresRejointes} icon="🏛️" accent="primary" />
              <StatCard label={t('stat_cotisations_paid')} value={stats.cotisationsPayees} icon="✅" accent="emerald" />
              <StatCard label={t('stat_cotisations_pending')} value={stats.cotisationsEnAttente} icon="⏳" accent="amber" />
              <StatCard label={t('stat_upcoming_events')} value={stats.evenementsAVenir} icon="📅" accent="rose" />
            </div>
          )}

          {tab === 'structures' && (
            <div className="space-y-4">
              {!peutCreer.peutCreer && peutCreer.raison === 'aucun_organe_central' && (
                <div className="card p-4 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                  Aucun organe central (CEE) n'est encore configuré sur la plateforme. Un administrateur doit désigner
                  la structure mère avant que de nouvelles structures puissent être créées.
                </div>
              )}
              {!peutCreer.peutCreer && peutCreer.raison === 'non_autorise' && peutCreer.organeCentral && (
                <div className="card p-4 text-xs text-gray-500 dark:text-gray-400">
                  Seul le président de <span className="font-semibold">{peutCreer.organeCentral.nom}</span> peut créer une nouvelle structure.
                </div>
              )}
              <div className="card divide-y divide-gray-100 dark:divide-gray-700">
                {adhesions.length === 0 && <p className="p-6 text-sm text-gray-400">Vous n'avez rejoint aucune structure. <Link to="/structures" className="text-primary-600 font-semibold">Explorer →</Link></p>}
                {adhesions.map((a) => (
                  <div key={a.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                        {a.structure?.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{a.structure?.nom}</p>
                        <p className="text-xs text-gray-400">{a.role_structure === 'president' ? 'Président' : 'Membre'}</p>
                      </div>
                    </div>
                    <Link to={a.role_structure === 'president' ? `/president/${a.structure_id}` : `/structures/${a.structure_id}`} className="text-sm font-semibold text-primary-600 hover:underline">
                      {t('btn_view')}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'cotisations' && (
            <div className="card divide-y divide-gray-100 dark:divide-gray-700">
              {cotisations.length === 0 && <p className="p-6 text-sm text-gray-400">Aucune cotisation pour le moment.</p>}
              {cotisations.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{c.structure?.nom} — {c.montant} FCFA</p>
                    <p className="text-xs text-gray-400">Échéance : {new Date(c.date_echeance).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {c.statut === 'payee' ? (
                    <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Payée</span>
                  ) : (
                    <button onClick={() => setPayingCotisation(c)} className="btn-primary !px-4 !py-1.5 text-xs">{t('btn_pay')}</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={enregistrerProfil} className="card p-6 max-w-lg space-y-4">
              <div>
                <label className="label">{t('field_prenom')}</label>
                <input className="input" value={profile.prenom} onChange={(e) => setProfile({ ...profile, prenom: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('field_nom')}</label>
                <input className="input" value={profile.nom} onChange={(e) => setProfile({ ...profile, nom: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('field_telephone')}</label>
                <input className="input" value={profile.telephone} onChange={(e) => setProfile({ ...profile, telephone: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary">{t('btn_save')}</button>
            </form>
          )}
        </div>
      </div>

      <Modal open={createOpen} title={t('btn_create_structure')} onClose={() => setCreateOpen(false)} onConfirm={creerStructure} confirmLabel={creating ? '...' : t('btn_publish')}>
        <form onSubmit={creerStructure} className="space-y-3">
          <div>
            <label className="label">Nom</label>
            <input required className="input" value={newStructure.nom} onChange={(e) => setNewStructure({ ...newStructure, nom: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input" value={newStructure.description} onChange={(e) => setNewStructure({ ...newStructure, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={newStructure.type} onChange={(e) => setNewStructure({ ...newStructure, type: e.target.value })}>
              {TYPES.map((tp) => <option key={tp} value={tp}>{t(`type_${tp}`)}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <PaymentModal cotisation={payingCotisation} onClose={() => setPayingCotisation(null)} onPaid={loadAll} />
    </div>
  );
}

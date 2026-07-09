import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [structures, setStructures] = useState([]);
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadAll = async () => {
    try {
      const [statsRes, usersRes, structuresRes, eventsRes, logsRes] = await Promise.all([
        api.get('/stats/admin'),
        api.get('/users'),
        api.get('/structures'),
        api.get('/events'),
        api.get('/stats/journal'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setStructures(structuresRes.data.structures || []);
      setEvents(eventsRes.data.evenements || []);
      setLogs(logsRes.data.logs || []);
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => { loadAll(); }, []);

  const items = [
    { key: 'overview', icon: '📊', labelKey: 'tab_overview' },
    { key: 'users', icon: '👥', labelKey: 'tab_users' },
    { key: 'structures', icon: '🏛️', labelKey: 'tab_structures' },
    { key: 'events', icon: '📅', labelKey: 'tab_events' },
    { key: 'log', icon: '🧾', labelKey: 'tab_activity_log' },
  ];

  const changerRole = async (id, role) => {
    try {
      await api.put(`/users/${id}`, { role });
      showToast('Rôle mis à jour.', 'success');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const toggleActivation = async (id) => {
    try {
      const { data } = await api.put(`/users/${id}/desactiver`);
      showToast(data.message, 'success');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const supprimerUtilisateur = async () => {
    try {
      await api.delete(`/users/${confirmDelete.id}`);
      showToast('Utilisateur supprimé.', 'success');
      setConfirmDelete(null);
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const supprimerStructure = async (id) => {
    if (!window.confirm('Supprimer cette structure ?')) return;
    await api.delete(`/structures/${id}`);
    showToast('Structure supprimée.', 'success');
    loadAll();
  };

  const definirOrganeCentral = async (id) => {
    try {
      const { data } = await api.put(`/structures/${id}/organe-central`);
      showToast(data.message, 'success');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const filteredUsers = users.filter((u) => `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-950 p-6 mb-8">
        <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1">🛡️ Administration système</p>
        <h1 className="font-display text-2xl font-bold text-white">{t('dashboard_admin_title')}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Sidebar items={items} active={tab} onSelect={setTab} theme="slate" />

        <div className="flex-1 space-y-6">
          {tab === 'overview' && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('stat_total_users')} value={stats.totalUtilisateurs} icon="👥" accent="primary" />
              <StatCard label={t('stat_total_structures')} value={stats.totalStructures} icon="🏛️" accent="emerald" />
              <StatCard label={t('stat_total_events')} value={stats.totalEvenements} icon="📅" accent="amber" />
              <StatCard label={t('stat_revenue')} value={`${stats.revenusTotal} FCFA`} icon="💰" accent="rose" />
            </div>
          )}

          {tab === 'users' && (
            <div>
              <input className="input mb-4 max-w-sm" placeholder={t('search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-xs uppercase text-gray-400">
                      <th className="p-3">Nom</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Rôle</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{u.prenom} {u.nom}</td>
                        <td className="p-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                        <td className="p-3">
                          <select value={u.role} onChange={(e) => changerRole(u.id, e.target.value)} className="input !py-1 !text-xs">
                            <option value="membre">Membre</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <span className={`badge ${u.actif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}>
                            {u.actif ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => toggleActivation(u.id)} className="text-xs font-semibold text-amber-600 hover:underline">
                            {u.actif ? 'Désactiver' : 'Réactiver'}
                          </button>
                          <button onClick={() => setConfirmDelete(u)} className="text-xs font-semibold text-red-600 hover:underline">{t('btn_delete')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'structures' && (
            <div className="space-y-4">
              <div className="card p-4 text-xs text-gray-500 dark:text-gray-400 bg-primary-50/50 dark:bg-primary-900/10">
                Seul le président de la structure marquée <span className="font-semibold text-primary-700 dark:text-primary-300">"Organe central (CEE)"</span> peut créer de nouvelles structures. Désignez-la ci-dessous.
              </div>
              <div className="card divide-y divide-gray-100 dark:divide-gray-700">
                {structures.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        {s.nom}
                        {s.est_organe_central && (
                          <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">👑 Organe central (CEE)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{t(`type_${s.type}`)} · {s.nombre_membres} membres</p>
                    </div>
                    <div className="flex gap-2">
                      {!s.est_organe_central && (
                        <button onClick={() => definirOrganeCentral(s.id)} className="btn-secondary !px-3 !py-1.5 text-xs">
                          Désigner comme CEE
                        </button>
                      )}
                      <button onClick={() => supprimerStructure(s.id)} className="btn-danger !px-3 !py-1.5 text-xs">{t('btn_delete')}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div className="card divide-y divide-gray-100 dark:divide-gray-700">
              {events.map((ev) => (
                <div key={ev.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{ev.titre}</p>
                    <p className="text-xs text-gray-400">{ev.structure?.nom} · {new Date(ev.date_debut).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'log' && (
            <div className="card divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {logs.length === 0 && <p className="p-6 text-sm text-gray-400">Aucune activité enregistrée.</p>}
              {logs.map((l) => (
                <div key={l.id} className="p-4">
                  <p className="text-sm text-gray-900 dark:text-white"><span className="font-semibold">{l.action}</span></p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{l.details}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{new Date(l.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!confirmDelete} title={t('btn_delete')} onClose={() => setConfirmDelete(null)} onConfirm={supprimerUtilisateur} confirmLabel={t('btn_delete')} danger>
        Voulez-vous vraiment supprimer {confirmDelete?.prenom} {confirmDelete?.nom} ? Cette action est irréversible.
      </Modal>
    </div>
  );
}

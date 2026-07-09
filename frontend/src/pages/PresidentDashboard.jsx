import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import GroupChat from '../components/GroupChat';
import Countdown from '../components/Countdown';

export default function PresidentDashboard() {
  const { structureId } = useParams();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [tab, setTab] = useState('overview');
  const [structure, setStructure] = useState(null);
  const [stats, setStats] = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [cotisations, setCotisations] = useState([]);

  const [eventModal, setEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ titre: '', description: '', date_debut: '', lieu: '' });
  const [annonceModal, setAnnonceModal] = useState(false);
  const [annonceForm, setAnnonceForm] = useState({ titre: '', contenu: '', date_echeance: '' });
  const [cotisationModal, setCotisationModal] = useState(false);
  const [cotisationForm, setCotisationForm] = useState({ montant: '', date_echeance: '', pour_tous_les_membres: true });
  const [informModal, setInformModal] = useState(false);
  const [informForm, setInformForm] = useState({ titre: '', message: '' });
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ nom: '', description: '', type: 'club' });

  const loadAll = async () => {
    try {
      const [sRes, statsRes, demRes, cotRes] = await Promise.all([
        api.get(`/structures/${structureId}`),
        api.get(`/stats/president/${structureId}`),
        api.get(`/structures/${structureId}/demandes`),
        api.get('/cotisations', { params: { structureId } }),
      ]);
      setStructure(sRes.data.structure);
      setEditForm({ nom: sRes.data.structure.nom, description: sRes.data.structure.description || '', type: sRes.data.structure.type });
      setStats(statsRes.data);
      setDemandes(demRes.data.demandes || []);
      setCotisations(cotRes.data.cotisations || []);
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => { loadAll(); }, [structureId]);

  const items = [
    { key: 'overview', icon: '📊', labelKey: 'tab_overview' },
    { key: 'requests', icon: '📥', labelKey: 'tab_requests', badge: demandes.length },
    { key: 'members', icon: '👥', labelKey: 'tab_members' },
    { key: 'events', icon: '📅', labelKey: 'tab_events' },
    { key: 'announcements', icon: '📣', labelKey: 'tab_announcements' },
    { key: 'cotisations', icon: '💳', labelKey: 'tab_cotisations' },
    { key: 'messages', icon: '💬', labelKey: 'tab_messages' },
    { key: 'settings', icon: '⚙️', labelKey: 'tab_profile' },
  ];

  const traiterDemande = async (id, decision) => {
    try {
      await api.put(`/adhesions/${id}`, { decision });
      showToast(decision === 'accepter' ? 'Demande acceptée.' : 'Demande refusée.', 'success');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const retirerMembre = async (userId) => {
    try {
      await api.put(`/structures/${structureId}/membres/${userId}/retirer`);
      showToast('Membre retiré.', 'success');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const publierEvenement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', { ...eventForm, structure_id: structureId });
      showToast('Événement publié avec succès.', 'success');
      setEventModal(false);
      setEventForm({ titre: '', description: '', date_debut: '', lieu: '' });
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const publierAnnonce = async (e) => {
    e.preventDefault();
    try {
      await api.post('/annonces', { ...annonceForm, structure_id: structureId });
      showToast('Annonce publiée.', 'success');
      setAnnonceModal(false);
      setAnnonceForm({ titre: '', contenu: '', date_echeance: '' });
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const creerCotisation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cotisations', { ...cotisationForm, structure_id: structureId });
      showToast('Cotisation créée pour les membres.', 'success');
      setCotisationModal(false);
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const envoyerInfo = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/structures/${structureId}/informer`, informForm);
      showToast(data.message, 'success');
      setInformModal(false);
      setInformForm({ titre: '', message: '' });
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const supprimerEvenement = async (id) => {
    await api.delete(`/events/${id}`);
    showToast('Événement supprimé.', 'success');
    loadAll();
  };

  const supprimerAnnonce = async (id) => {
    await api.delete(`/annonces/${id}`);
    showToast('Annonce supprimée.', 'success');
    loadAll();
  };

  const enregistrerStructure = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/structures/${structureId}`, editForm);
      showToast('Structure mise à jour.', 'success');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  const supprimerStructure = async () => {
    if (!window.confirm('Supprimer définitivement cette structure ?')) return;
    try {
      await api.delete(`/structures/${structureId}`);
      showToast('Structure supprimée.', 'success');
      window.location.href = '/tableau-de-bord';
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  if (!structure) return <div className="flex h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {structure.logo && (
            <img src={structure.logo} alt={structure.nom} className="h-14 w-14 rounded-xl object-cover border-2 border-white/30" />
          )}
          <div>
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide mb-1">👑 Espace Président</p>
            <h1 className="font-display text-2xl font-bold text-white">{structure.nom}</h1>
            <p className="text-emerald-100/80 text-sm">{t('dashboard_president_title')}</p>
          </div>
        </div>
        <button onClick={() => setInformModal(true)} className="btn-primary !bg-white !text-emerald-700 hover:!bg-emerald-50">📣 {t('btn_inform_members')}</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Sidebar items={items} active={tab} onSelect={setTab} theme="emerald" />

        <div className="flex-1 space-y-6">
          {tab === 'overview' && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('stat_total_members')} value={stats.nombreMembres} icon="👥" accent="primary" />
              <StatCard label={t('stat_total_events')} value={stats.nombreEvenements} icon="📅" accent="emerald" />
              <StatCard label={t('stat_pending_requests')} value={stats.demandesEnAttente} icon="📥" accent="amber" />
              <StatCard label={t('stat_revenue')} value={`${stats.revenus} FCFA`} icon="💰" accent="rose" />
            </div>
          )}

          {tab === 'requests' && (
            <div className="card divide-y divide-gray-100 dark:divide-gray-700">
              {demandes.length === 0 && <p className="p-6 text-sm text-gray-400">Aucune demande en attente.</p>}
              {demandes.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{d.utilisateur?.prenom} {d.utilisateur?.nom}</p>
                    <p className="text-xs text-gray-400">{d.utilisateur?.email}</p>
                    {d.message && (
                      <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1 max-w-md">"{d.message}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => traiterDemande(d.id, 'accepter')} className="btn-primary !px-3 !py-1.5 text-xs">{t('btn_accept')}</button>
                    <button onClick={() => traiterDemande(d.id, 'rejeter')} className="btn-danger !px-3 !py-1.5 text-xs">{t('btn_reject')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'members' && (
            <div className="card divide-y divide-gray-100 dark:divide-gray-700">
              {(structure.adhesions || []).length === 0 && <p className="p-6 text-sm text-gray-400">Aucun membre pour le moment.</p>}
              {(structure.adhesions || []).map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{a.utilisateur?.prenom} {a.utilisateur?.nom}</p>
                    <p className="text-xs text-gray-400">{a.role_structure === 'president' ? 'Président' : 'Membre'}</p>
                  </div>
                  {a.role_structure !== 'president' && (
                    <button onClick={() => retirerMembre(a.utilisateur?.id)} className="btn-danger !px-3 !py-1.5 text-xs">Retirer</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'events' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setEventModal(true)} className="btn-primary">+ {t('btn_create_event')}</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(structure.evenements || []).map((ev) => (
                  <div key={ev.id} className="card p-4 space-y-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{ev.titre}</p>
                    <p className="text-xs text-gray-400">📍 {ev.lieu} · {new Date(ev.date_debut).toLocaleDateString('fr-FR')}</p>
                    <Countdown targetDate={ev.date_debut} compact />
                    <button onClick={() => supprimerEvenement(ev.id)} className="text-xs text-red-500 hover:underline">{t('btn_delete')}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'announcements' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setAnnonceModal(true)} className="btn-primary">+ {t('btn_create_announcement')}</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(structure.annonces || []).map((a) => (
                  <div key={a.id} className="card p-4 space-y-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{a.titre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{a.contenu}</p>
                    {a.date_echeance && <Countdown targetDate={a.date_echeance} compact />}
                    <button onClick={() => supprimerAnnonce(a.id)} className="text-xs text-red-500 hover:underline">{t('btn_delete')}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'cotisations' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setCotisationModal(true)} className="btn-primary">+ Définir une cotisation</button>
              </div>
              <div className="card divide-y divide-gray-100 dark:divide-gray-700">
                {cotisations.length === 0 && <p className="p-6 text-sm text-gray-400">Aucune cotisation créée.</p>}
                {cotisations.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{c.membre?.prenom} {c.membre?.nom} — {c.montant} FCFA</p>
                      <p className="text-xs text-gray-400">Échéance : {new Date(c.date_echeance).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className={`badge ${c.statut === 'payee' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                      {c.statut === 'payee' ? 'Payée' : 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'messages' && <GroupChat structureId={structureId} />}

          {tab === 'settings' && (
            <div className="card p-6 max-w-lg space-y-4">
              <form onSubmit={enregistrerStructure} className="space-y-4">
                <div>
                  <label className="label">Nom</label>
                  <input className="input" value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea rows={4} className="input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary">{t('btn_save')}</button>
              </form>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={supprimerStructure} className="btn-danger">Supprimer la structure</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={eventModal} title={t('btn_create_event')} onClose={() => setEventModal(false)} onConfirm={publierEvenement} confirmLabel={t('btn_publish')}>
        <form onSubmit={publierEvenement} className="space-y-3">
          <input required placeholder="Titre" className="input" value={eventForm.titre} onChange={(e) => setEventForm({ ...eventForm, titre: e.target.value })} />
          <textarea required placeholder="Description" rows={3} className="input" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
          <input required type="datetime-local" className="input" value={eventForm.date_debut} onChange={(e) => setEventForm({ ...eventForm, date_debut: e.target.value })} />
          <input required placeholder="Lieu" className="input" value={eventForm.lieu} onChange={(e) => setEventForm({ ...eventForm, lieu: e.target.value })} />
        </form>
      </Modal>

      <Modal open={annonceModal} title={t('btn_create_announcement')} onClose={() => setAnnonceModal(false)} onConfirm={publierAnnonce} confirmLabel={t('btn_publish')}>
        <form onSubmit={publierAnnonce} className="space-y-3">
          <input required placeholder="Titre" className="input" value={annonceForm.titre} onChange={(e) => setAnnonceForm({ ...annonceForm, titre: e.target.value })} />
          <textarea required placeholder="Contenu" rows={3} className="input" value={annonceForm.contenu} onChange={(e) => setAnnonceForm({ ...annonceForm, contenu: e.target.value })} />
          <label className="label">Échéance (optionnel, pour le compte à rebours)</label>
          <input type="datetime-local" className="input" value={annonceForm.date_echeance} onChange={(e) => setAnnonceForm({ ...annonceForm, date_echeance: e.target.value })} />
        </form>
      </Modal>

      <Modal open={cotisationModal} title="Définir une cotisation" onClose={() => setCotisationModal(false)} onConfirm={creerCotisation} confirmLabel={t('btn_publish')}>
        <form onSubmit={creerCotisation} className="space-y-3">
          <input required type="number" placeholder="Montant (FCFA)" className="input" value={cotisationForm.montant} onChange={(e) => setCotisationForm({ ...cotisationForm, montant: e.target.value })} />
          <input required type="date" className="input" value={cotisationForm.date_echeance} onChange={(e) => setCotisationForm({ ...cotisationForm, date_echeance: e.target.value })} />
          <p className="text-xs text-gray-400">Sera appliquée à tous les membres actifs de la structure.</p>
        </form>
      </Modal>

      <Modal open={informModal} title={t('btn_inform_members')} onClose={() => setInformModal(false)} onConfirm={envoyerInfo} confirmLabel={t('btn_send')}>
        <form onSubmit={envoyerInfo} className="space-y-3">
          <input required placeholder="Titre" className="input" value={informForm.titre} onChange={(e) => setInformForm({ ...informForm, titre: e.target.value })} />
          <textarea required placeholder="Message" rows={4} className="input" value={informForm.message} onChange={(e) => setInformForm({ ...informForm, message: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}

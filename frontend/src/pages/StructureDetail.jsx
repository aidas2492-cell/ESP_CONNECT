import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import EventCard from '../components/EventCard';
import AnnouncementCard from '../components/AnnouncementCard';
import GroupChat from '../components/GroupChat';
import Modal from '../components/Modal';

const TABS = ['apercu', 'evenements', 'annonces', 'messagerie'];

export default function StructureDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [structure, setStructure] = useState(null);
  const [monAdhesion, setMonAdhesion] = useState(null);
  const [tab, setTab] = useState('apercu');
  const [loading, setLoading] = useState(true);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [joining, setJoining] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/structures/${id}`);
      setStructure(data.structure);
      setMonAdhesion(data.monAdhesion);
    } catch {
      setStructure(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const demanderAdhesion = async () => {
    setJoining(true);
    try {
      await api.post(`/structures/${id}/adhesions`, { message: joinMessage.trim() || undefined });
      showToast(t('msg_join_requested'), 'success');
      setJoinModal(false);
      setJoinMessage('');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_join_error'), 'error');
    } finally {
      setJoining(false);
    }
  };

  const quitterStructure = async () => {
    try {
      await api.put(`/structures/${id}/quitter`);
      showToast(t('msg_left_structure'), 'success');
      setConfirmLeave(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    }
  };

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  }

  if (!structure) {
    return <div className="text-center py-24 text-gray-400">Structure introuvable.</div>;
  }

  const estMembreActif = monAdhesion?.statut === 'active';
  const estPresident = estMembreActif && monAdhesion?.role_structure === 'president';
  const estEnAttente = monAdhesion?.statut === 'en_attente';

  return (
    <div>
      <section className="relative h-56 sm:h-64 bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
        {structure.logo && <img src={structure.logo} alt={structure.nom} className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <div className="relative mx-auto max-w-7xl h-full px-6 flex items-end pb-6">
          <div>
            <span className="badge bg-white/20 text-white mb-2">{t(`type_${structure.type}`)}</span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">{structure.nom}</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 overflow-x-auto border-b border-gray-100 dark:border-gray-800 pb-px">
            {TABS.map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  tab === tb ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {tb === 'apercu' ? 'Aperçu' : tb === 'evenements' ? t('tab_events') : tb === 'annonces' ? t('tab_announcements') : t('tab_messages')}
              </button>
            ))}
          </div>

          {tab === 'apercu' && (
            <div className="card p-6">
              <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-3">À propos</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{structure.description || 'Aucune description fournie.'}</p>
            </div>
          )}

          {tab === 'evenements' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(structure.evenements || []).length === 0 && <p className="text-gray-400 text-sm col-span-2">Aucun événement pour le moment.</p>}
              {(structure.evenements || []).map((ev) => <EventCard key={ev.id} event={{ ...ev, structure }} />)}
            </div>
          )}

          {tab === 'annonces' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(structure.annonces || []).length === 0 && <p className="text-gray-400 text-sm col-span-2">Aucune annonce pour le moment.</p>}
              {(structure.annonces || []).map((a) => <AnnouncementCard key={a.id} annonce={{ ...a, structure }} />)}
            </div>
          )}

          {tab === 'messagerie' && (
            estMembreActif ? (
              <GroupChat structureId={id} />
            ) : (
              <div className="card p-10 text-center text-gray-400 text-sm">
                Rejoignez la structure pour accéder à la messagerie de groupe.
              </div>
            )
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">👥 {structure.adhesions?.length ?? 0} membre(s)</p>

            {!user && (
              <Link to="/connexion" state={{ from: `/structures/${id}` }} className="btn-primary w-full">
                {t('nav_login')} pour rejoindre
              </Link>
            )}

            {user && estPresident && (
              <Link to={`/president/${id}`} className="btn-primary w-full">
                Gérer ma structure
              </Link>
            )}

            {user && estMembreActif && !estPresident && (
              <button onClick={() => setConfirmLeave(true)} className="btn-secondary w-full">
                {t('btn_leave')}
              </button>
            )}

            {user && estEnAttente && (
              <button disabled className="btn-secondary w-full opacity-60 cursor-not-allowed">
                {t('btn_pending')}
              </button>
            )}

            {user && !monAdhesion && (
              <button onClick={() => setJoinModal(true)} className="btn-primary w-full">
                {t('btn_join')}
              </button>
            )}
          </div>

          {estMembreActif && (structure.adhesions?.length > 0) && (
            <div className="card p-6">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Membres actifs</h3>
              <div className="flex flex-wrap gap-2">
                {(structure.adhesions || []).slice(0, 12).map((a) => (
                  <div key={a.id} title={`${a.utilisateur?.prenom} ${a.utilisateur?.nom}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-xs font-bold">
                    {a.utilisateur?.prenom?.[0]}{a.utilisateur?.nom?.[0]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <Modal
        open={confirmLeave}
        title={t('btn_leave')}
        onClose={() => setConfirmLeave(false)}
        onConfirm={quitterStructure}
        confirmLabel={t('btn_leave')}
        danger
      >
        Voulez-vous vraiment quitter "{structure.nom}" ? Vous pourrez redemander à adhérer plus tard.
      </Modal>

      <Modal
        open={joinModal}
        title={`Demande d'adhésion — ${structure.nom}`}
        onClose={() => setJoinModal(false)}
        onConfirm={demanderAdhesion}
        confirmLabel={joining ? '...' : 'Envoyer la demande'}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Votre demande sera examinée par le président de la structure.</p>
        <label className="label">Message (optionnel)</label>
        <textarea
          rows={3}
          maxLength={300}
          className="input"
          placeholder="Pourquoi souhaitez-vous rejoindre cette structure ?"
          value={joinMessage}
          onChange={(e) => setJoinMessage(e.target.value)}
        />
        <p className="text-right text-xs text-gray-400 mt-1">{joinMessage.length}/300</p>
      </Modal>
    </div>
  );
}

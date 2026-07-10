import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import StructureCarousel from '../components/StructureCarousel';
import EventCard from '../components/EventCard';
import AnnouncementCard from '../components/AnnouncementCard';
import TrendingWidget from '../components/TrendingWidget';
import MembresEnVueWidget from '../components/MembresEnVueWidget';
import GalerieWidget from '../components/GalerieWidget';
import ConceptCarousel from '../components/ConceptCarousel';
import PhotoMarquee from '../components/PhotoMarquee';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [structures, setStructures] = useState([]);
  const [events, setEvents] = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, eRes, aRes] = await Promise.all([
          api.get('/structures'),
          api.get('/events', { params: { a_venir: true } }),
          api.get('/annonces'),
        ]);
        setStructures(sRes.data.structures || []);
        setEvents((eRes.data.evenements || []).slice(0, 8));
        setAnnonces((aRes.data.annonces || []).slice(0, 6));
      } catch {
        /* silencieux : l'accueil reste utilisable même hors ligne du serveur */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalMembres = structures.reduce((acc, s) => acc + (s.nombre_membres || 0), 0);

  // Un utilisateur connecté est redirigé directement vers son tableau de bord :
  // la page d'accueil publique ne s'affiche que pour les Visiteurs non connectés.
  if (!authLoading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/tableau-de-bord'} replace />;
  }

  return (
    <div>
      {/* HERO — inspiré de la charte officielle ESP (navy + blanc, cartes statistiques) */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <span className="inline-block rounded-full bg-primary-50 dark:bg-primary-900/30 px-4 py-1.5 text-xs font-bold text-primary-700 dark:text-primary-300 tracking-wide uppercase mb-6">
              École Supérieure Polytechnique — Dakar
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight bg-gradient-to-r from-primary-700 via-primary-600 to-violet-600 dark:from-primary-300 dark:via-primary-400 dark:to-violet-400 bg-clip-text text-transparent">
              {t('home_hero_title')}
            </h1>
            <p className="mt-5 text-base text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
              {t('home_hero_subtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/structures" className="btn-primary !px-7 !py-3 text-base">
                {t('home_hero_cta_primary')}
              </Link>
              <Link to="/inscription" className="btn-secondary !px-7 !py-3 text-base">
                {t('home_hero_cta_secondary')}
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-in [animation-delay:150ms] opacity-0">
            <ConceptCarousel compact />
          </div>
        </div>

        {/* Cartes statistiques, style bandeau ESP officiel */}
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: t('home_stat_structures'), value: structures.length, icon: '🏛️' },
              { label: t('home_stat_events'), value: events.length, icon: '📅' },
              { label: t('home_stat_members'), value: totalMembres, icon: '🎓' },
            ].map((s) => (
              <div key={s.label} className="card p-6 flex items-center gap-4">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <p className="font-display text-3xl font-extrabold text-primary-700 dark:text-primary-300">{s.value}+</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANDE PHOTOS DÉFILANTES */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <PhotoMarquee />
      </section>

      {/* STRUCTURES CAROUSEL */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-6 px-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('home_structures_title')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('home_structures_subtitle')}</p>
          </div>
          <Link to="/structures" className="text-sm font-semibold text-primary-600 hover:underline whitespace-nowrap">
            {t('nav_structures')} →
          </Link>
        </div>
        {!loading && <StructureCarousel structures={structures} />}
      </section>

      {/* EVENTS */}
      {events.length > 0 && (
        <section className="bg-white dark:bg-gray-800/40 border-y border-gray-100 dark:border-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-2">{t('home_events_title')}</h2>
            <div className="flex gap-5 overflow-x-auto pb-2 px-2 [scrollbar-width:thin]">
              {events.map((ev) => (
                <div key={ev.id} className="w-72 shrink-0"><EventCard event={ev} /></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ANNOUNCEMENTS WITH COUNTDOWN */}
      {annonces.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-2">{t('home_announcements_title')}</h2>
          <div className="flex gap-5 overflow-x-auto pb-2 px-2 [scrollbar-width:thin]">
            {annonces.map((a) => (
              <AnnouncementCard key={a.id} annonce={a} />
            ))}
          </div>
        </section>
      )}

      {/* CAMPUS GALLERY (photos issues des vraies publications du fil) */}
      <GalerieWidget />

      {/* TENDANCES & MEMBRES EN VUE — style fil de campus */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">La vie du campus</h2>
          <Link to="/fil" className="text-sm font-semibold text-primary-600 hover:underline whitespace-nowrap">
            Voir le fil complet →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
          <TrendingWidget />
          <MembresEnVueWidget />
        </div>
      </section>
    </div>
  );
}

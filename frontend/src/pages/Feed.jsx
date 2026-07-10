import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';
import TrendingWidget from '../components/TrendingWidget';
import MembresEnVueWidget from '../components/MembresEnVueWidget';
import ProfileSummaryCard from '../components/ProfileSummaryCard';
import SuggestionsWidget from '../components/SuggestionsWidget';
import { useAuth } from '../context/AuthContext';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const charger = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/feed', { params: { page: p, limit: 10 } });
      if (p === 1) setPosts(data.posts);
      else setPosts((prev) => [...prev, ...data.posts]);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(1); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-6 items-start">
        {/* Colonne gauche : résumé de profil */}
        <aside className="hidden lg:block lg:sticky lg:top-20 space-y-6">
          {user ? <ProfileSummaryCard /> : (
            <div className="card p-5 text-sm text-gray-500 dark:text-gray-400">
              Connectez-vous pour publier et interagir avec le fil du campus.
            </div>
          )}
        </aside>

        {/* Colonne centrale : fil de publications */}
        <div className="space-y-5 min-w-0">
          <div className="mb-2">
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Fil du campus</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Ce qui se passe en ce moment à l'ESP</p>
          </div>

          <PostComposer onPosted={(post) => setPosts((prev) => [post, ...prev])} />

          {loading && posts.length === 0 && (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="card p-10 text-center text-gray-400 text-sm">
              Aucune publication pour le moment. Soyez le premier à partager quelque chose !
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
          ))}

          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <button onClick={() => charger(page + 1)} className="btn-secondary">Voir plus</button>
            </div>
          )}
        </div>

        {/* Colonne droite : tendances, membres en vue, suggestions de réseau */}
        <aside className="space-y-6 lg:sticky lg:top-20">
          {user && <SuggestionsWidget />}
          <TrendingWidget />
          <MembresEnVueWidget />
        </aside>
      </div>
    </div>
  );
}

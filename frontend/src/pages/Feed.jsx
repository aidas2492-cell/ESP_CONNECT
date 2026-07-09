import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';
import TrendingWidget from '../components/TrendingWidget';
import MembresEnVueWidget from '../components/MembresEnVueWidget';

export default function Feed() {
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Fil du campus</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Ce qui se passe en ce moment à l'ESP</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
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

        <aside className="space-y-6">
          <TrendingWidget />
          <MembresEnVueWidget />
        </aside>
      </div>
    </div>
  );
}

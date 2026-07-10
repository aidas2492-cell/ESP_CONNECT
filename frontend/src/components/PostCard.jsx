import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from './VerifiedBadge';

const REACTIONS = [
  { type: 'jaime', emoji: '👍', label: 'J’aime' },
  { type: 'jadore', emoji: '❤️', label: 'J’adore' },
  { type: 'bravo', emoji: '👏', label: 'Bravo' },
  { type: 'super', emoji: '🎉', label: 'Super' },
];

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const [maReaction, setMaReaction] = useState(post.maReaction || null);
  const [reactionsParType, setReactionsParType] = useState(post.reactionsParType || {});
  const [nombreLikes, setNombreLikes] = useState(post.nombreLikes || 0);
  const [showPicker, setShowPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [nombreCommentaires, setNombreCommentaires] = useState(post.nombreCommentaires);
  const hideTimer = useRef(null);

  const appliquerReaction = async (type) => {
    if (!user) return;
    setShowPicker(false);

    const ancienneReaction = maReaction;
    const ancienCompteur = { ...reactionsParType };
    const ancienTotal = nombreLikes;

    const nouveauCompteur = { ...reactionsParType };
    if (ancienneReaction) nouveauCompteur[ancienneReaction] = Math.max(0, (nouveauCompteur[ancienneReaction] || 0) - 1);
    let nouveauTotal = ancienneReaction ? nombreLikes - 1 : nombreLikes;
    let nouvelleReaction = null;
    if (ancienneReaction !== type) {
      nouveauCompteur[type] = (nouveauCompteur[type] || 0) + 1;
      nouveauTotal += 1;
      nouvelleReaction = type;
    }
    setReactionsParType(nouveauCompteur);
    setNombreLikes(nouveauTotal);
    setMaReaction(nouvelleReaction);

    try {
      await api.post(`/feed/${post.id}/like`, { type });
    } catch {
      setReactionsParType(ancienCompteur);
      setNombreLikes(ancienTotal);
      setMaReaction(ancienneReaction);
    }
  };

  const ouvrirPicker = () => {
    clearTimeout(hideTimer.current);
    setShowPicker(true);
  };
  const fermerPickerDifferee = () => {
    hideTimer.current = setTimeout(() => setShowPicker(false), 300);
  };

  const loadComments = async () => {
    setShowComments((s) => !s);
    if (comments === null) {
      try {
        const { data } = await api.get(`/feed/${post.id}/comments`);
        setComments(data.commentaires || []);
      } catch {
        setComments([]);
      }
    }
  };

  const envoyerCommentaire = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/feed/${post.id}/comments`, { contenu: commentText.trim() });
      setComments((c) => [...(c || []), data.commentaire]);
      setNombreCommentaires((n) => n + 1);
      setCommentText('');
    } catch {
      /* silencieux */
    }
  };

  const supprimer = async () => {
    try {
      await api.delete(`/feed/${post.id}`);
      onDeleted?.(post.id);
    } catch {
      /* silencieux */
    }
  };

  const auteurNom = post.structure ? post.structure.nom : `${post.auteur?.prenom} ${post.auteur?.nom}`;
  const auteurPhoto = post.structure?.logo || post.auteur?.photo;
  const reactionActive = REACTIONS.find((r) => r.type === maReaction);
  const typesUtilises = REACTIONS.filter((r) => (reactionsParType?.[r.type] || 0) > 0);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Link to={post.structure ? `/structures/${post.structure.id}` : `/profil/${post.auteur?.id}`} className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-bold text-sm">
          {auteurPhoto ? <img src={auteurPhoto} alt={auteurNom} className="h-full w-full object-cover" /> : auteurNom?.[0]}
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1">
            <Link to={post.structure ? `/structures/${post.structure.id}` : `/profil/${post.auteur?.id}`} className="hover:underline">{auteurNom}</Link>
            {post.auteur?.verifie && <VerifiedBadge />}
          </p>
          {post.auteur?.bio && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{post.auteur.bio}</p>}
          <p className="text-xs text-gray-400">
            {post.auteur?.prenom} {post.auteur?.nom} · {new Date(post.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {user?.id === post.auteur?.id && (
          <button onClick={supprimer} className="text-xs text-gray-400 hover:text-red-500">✕</button>
        )}
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{post.contenu}</p>

      {post.image && (
        <img src={post.image} alt="" className="rounded-xl max-h-96 w-full object-cover" />
      )}

      {(() => {
        let tags = post.hashtags;
        if (typeof tags === 'string') {
          try { tags = JSON.parse(tags); } catch { tags = []; }
        }
        if (!Array.isArray(tags) || tags.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-2">
            {tags.map((h) => (
              <span key={h} className="text-xs font-medium text-primary-600 dark:text-primary-400">#{h}</span>
            ))}
          </div>
        );
      })()}

      {typesUtilises.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span className="flex -space-x-1">
            {typesUtilises.map((r) => (
              <span key={r.type} className="flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-[10px] ring-1 ring-white dark:ring-gray-800">{r.emoji}</span>
            ))}
          </span>
          <span>{nombreLikes}</span>
        </div>
      )}

      <div className="flex items-center gap-5 pt-2 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        <div className="relative" onMouseEnter={ouvrirPicker} onMouseLeave={fermerPickerDifferee}>
          {showPicker && user && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 px-2 py-1.5 z-10">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => appliquerReaction(r.type)}
                  title={r.label}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => appliquerReaction(maReaction || 'jaime')}
            disabled={!user}
            className={`flex items-center gap-1.5 transition ${reactionActive ? 'text-primary-600 font-semibold' : 'hover:text-primary-600'}`}
          >
            <span>{reactionActive ? reactionActive.emoji : '👍'}</span> {reactionActive ? reactionActive.label : 'J’aime'}
          </button>
        </div>
        <button onClick={loadComments} className="flex items-center gap-1.5 hover:text-primary-600">
          💬 {nombreCommentaires}
        </button>
      </div>

      {showComments && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-3">
          {(comments || []).map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                {c.auteur?.prenom?.[0]}
              </div>
              <div className="rounded-xl bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm">
                <span className="font-semibold text-gray-800 dark:text-gray-100 mr-1.5">{c.auteur?.prenom}</span>
                <span className="text-gray-600 dark:text-gray-300">{c.contenu}</span>
              </div>
            </div>
          ))}
          {user && (
            <form onSubmit={envoyerCommentaire} className="flex gap-2 pt-1">
              <input
                className="input flex-1 !py-1.5"
                placeholder="Écrire un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button className="btn-primary !px-3 !py-1.5 text-xs">Envoyer</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

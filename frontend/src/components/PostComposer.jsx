import React, { useRef, useState } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function PostComposer({ onPosted }) {
  const { user } = useAuth();
  const [texte, setTexte] = useState('');
  const [lieu, setLieu] = useState('');
  const [showLieu, setShowLieu] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const fileRef = useRef(null);

  const choisirImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const publier = async (e) => {
    e.preventDefault();
    if (!texte.trim()) return;
    setEnvoi(true);
    try {
      const form = new FormData();
      form.append('contenu', texte.trim());
      if (lieu.trim()) form.append('lieu', lieu.trim());
      if (image) form.append('image', image);

      const { data } = await api.post('/feed', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onPosted?.(data.post);
      setTexte('');
      setLieu('');
      setShowLieu(false);
      setImage(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      /* silencieux */
    } finally {
      setEnvoi(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={publier} className="card p-5 space-y-3">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-bold text-sm">
          {user.prenom?.[0]}
        </div>
        <textarea
          rows={2}
          className="input flex-1 resize-none"
          placeholder={`Quoi de neuf sur le campus, ${user.prenom} ?`}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
        />
      </div>

      {preview && (
        <div className="relative ml-12">
          <img src={preview} alt="" className="rounded-xl max-h-56 object-cover" />
          <button type="button" onClick={() => { setImage(null); setPreview(null); }} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white text-xs">✕</button>
        </div>
      )}

      {showLieu && (
        <input
          className="input ml-12 !w-[calc(100%-3rem)]"
          placeholder="Lieu (ex: Amphi A, Terrain ESP...)"
          value={lieu}
          onChange={(e) => setLieu(e.target.value)}
        />
      )}

      <div className="flex items-center justify-between ml-12 pt-1">
        <div className="flex gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary !px-3 !py-1.5 text-xs">📷 Photo</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={choisirImage} className="hidden" />
          <button type="button" onClick={() => setShowLieu((s) => !s)} className="btn-secondary !px-3 !py-1.5 text-xs">📍 Lieu</button>
          <span className="btn-secondary !px-3 !py-1.5 text-xs opacity-60 cursor-default"># Tag (dans le texte)</span>
        </div>
        <button type="submit" disabled={envoi || !texte.trim()} className="btn-primary !px-5">
          {envoi ? '...' : 'Publier'}
        </button>
      </div>
    </form>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError(
        t('field_confirm_password') +
          (' — ' + (t('lang') === 'en' ? 'passwords do not match.' : 'les mots de passe ne correspondent pas.'))
      );
      return;
    }

    setLoading(true);
    try {
      await register({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone,
        password: form.password,
      });
      showToast(t('msg_register_success'), 'success');
      navigate('/tableau-de-bord', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('msg_generic_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t('register_title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('register_subtitle')}</p>
        <p className="mt-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 px-3 py-2 text-xs text-primary-700 dark:text-primary-300">
          Tout nouveau compte est créé avec le rôle Membre. Créez votre propre structure depuis votre tableau de bord pour en devenir Président.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('field_prenom')}</label>
              <input required className="input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('field_nom')}</label>
              <input required className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">{t('field_email')}</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('field_telephone')}</label>
            <input className="input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('field_password')}</label>
              <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('field_confirm_password')}</label>
              <input type="password" required minLength={6} className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
            {loading ? '...' : t('register_title')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('have_account')}{' '}
          <Link to="/connexion" className="font-semibold text-primary-600 hover:underline">
            {t('nav_login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

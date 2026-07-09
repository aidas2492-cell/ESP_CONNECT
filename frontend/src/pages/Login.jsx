import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      showToast(t('msg_login_success'), 'success');
      const redirectTo = location.state?.from || (user.role === 'admin' ? '/admin' : '/tableau-de-bord');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('msg_generic_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t('login_title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('login_subtitle')}</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="label">{t('field_email')}</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('field_password')}</label>
            <input
              type="password"
              required
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
            {loading ? '...' : t('login_title')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('no_account')}{' '}
          <Link to="/inscription" className="font-semibold text-primary-600 hover:underline">
            {t('nav_register')}
          </Link>
        </p>
      </div>
    </div>
  );
}

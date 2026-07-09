import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axiosInstance';

const roleHomePath = (user) => {
  if (!user) return '/connexion';
  if (user.role === 'admin') return '/admin';
  return '/tableau-de-bord';
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { lang, changeLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        setUnread(data.nonLues || 0);
      } catch {
        /* silencieux */
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition hover:text-primary-600 ${
      isActive ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
        <Link to={user ? roleHomePath(user) : '/'} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white font-display font-bold">
            E
          </div>
          <span className="font-display text-lg font-bold text-gray-900 dark:text-white">ESP<span className="text-primary-600">Connect</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>{t('nav_home')}</NavLink>
          <NavLink to="/fil" className={linkClass}>Fil du campus</NavLink>
          <NavLink to="/structures" className={linkClass}>{t('nav_structures')}</NavLink>
          <NavLink to="/evenements" className={linkClass}>{t('nav_events')}</NavLink>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={lang}
            onChange={(e) => changeLanguage(e.target.value)}
            className="hidden sm:block rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300"
            aria-label={t('language')}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>

          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <Link to="/messages" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" title="Messages">
                💬
              </Link>
              <Link to="/notifications" className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                🔔
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 text-xs font-bold">
                    {user.prenom?.[0]}{user.nom?.[0]}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">{user.prenom}</span>
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <Link to={roleHomePath(user)} onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                      {t('nav_dashboard')}
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      {t('nav_logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn-secondary !px-4 !py-2">{t('nav_login')}</Link>
              <Link to="/inscription" className="btn-primary !px-4 !py-2 hidden sm:inline-flex">{t('nav_register')}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

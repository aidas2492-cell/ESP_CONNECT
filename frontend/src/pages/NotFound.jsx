import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <p className="font-display text-8xl font-extrabold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Page introuvable</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn-primary mt-6">Retour à l'accueil</Link>
    </div>
  );
}

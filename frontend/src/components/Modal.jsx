import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Modal({ open, title, children, onClose, onConfirm, confirmLabel, danger = false }) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{children}</div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>{t('btn_cancel')}</button>
          {onConfirm && (
            <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
              {confirmLabel || t('btn_confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

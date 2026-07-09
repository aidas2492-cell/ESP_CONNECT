import React, { useState } from 'react';
import api from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

// Constructeurs de lien de paiement. En production, remplacez ces URLs par
// les liens marchands réels fournis par Wave Business / Orange Money API,
// générés côté serveur avec vos identifiants marchands (clé API, merchant_id).
const buildWaveLink = (montant, reference) =>
  `https://pay.wave.com/m/M_pRoDucTion/c/sn/?amount=${montant}&reference=${reference}`;

const buildOrangeMoneyLink = (montant, reference) =>
  `https://webpay.orange-money.com/sn/pay?amount=${montant}&reference=${reference}`;

export default function PaymentModal({ cotisation, onClose, onPaid }) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [mode, setMode] = useState(null);
  const [processing, setProcessing] = useState(false);

  if (!cotisation) return null;

  const reference = `ESP-COT-${cotisation.id}`;

  const choisirMode = (m) => {
    setMode(m);
    const url = m === 'wave' ? buildWaveLink(cotisation.montant, reference) : buildOrangeMoneyLink(cotisation.montant, reference);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const confirmerPaiement = async () => {
    setProcessing(true);
    try {
      await api.put(`/cotisations/${cotisation.id}/payer`, { mode_paiement: mode });
      showToast('Paiement enregistré avec succès.', 'success');
      onPaid?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || t('msg_generic_error'), 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">{t('btn_pay')} la cotisation</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Montant : {cotisation.montant} FCFA</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          <button
            onClick={() => choisirMode('wave')}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
              mode === 'wave' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1DC8CD] text-white font-bold">W</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Wave</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Payer via l’app Wave</p>
            </div>
          </button>

          <button
            onClick={() => choisirMode('orange_money')}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
              mode === 'orange_money' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF7900] text-white font-bold">OM</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Orange Money</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Payer via Orange Money</p>
            </div>
          </button>

          {mode && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Un onglet {mode === 'wave' ? 'Wave' : 'Orange Money'} vient de s’ouvrir. Une fois le paiement confirmé, cliquez ci-dessous.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>{t('btn_cancel')}</button>
          <button className="btn-primary" disabled={!mode || processing} onClick={confirmerPaiement}>
            {processing ? '...' : "J'ai payé"}
          </button>
        </div>
      </div>
    </div>
  );
}

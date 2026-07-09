import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

export default function TrendingWidget() {
  const [tendances, setTendances] = useState([]);

  useEffect(() => {
    api.get('/feed/meta/tendances').then(({ data }) => setTendances(data.tendances || [])).catch(() => {});
  }, []);

  if (tendances.length === 0) return null;

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        📈 Tendances cette semaine
      </h3>
      <div className="space-y-3">
        {tendances.map((t, i) => (
          <div key={t.tag} className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400">{i + 1} · Tendance campus</p>
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">#{t.tag}</p>
            </div>
            <span className="text-xs text-gray-400">{t.count} posts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

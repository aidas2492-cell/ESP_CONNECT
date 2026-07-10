import React from 'react';

export default function VerifiedBadge({ size = 'sm' }) {
  const dims = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <span title="Compte vérifié (président ou administrateur)" className="inline-flex shrink-0">
      <svg viewBox="0 0 24 24" className={`${dims} fill-primary-600`}>
        <path d="M12 1l2.6 2.1 3.3-.5 1 3.2 3.1 1.2-.6 3.3 2.1 2.6-2.1 2.6.6 3.3-3.1 1.2-1 3.2-3.3-.5L12 23l-2.6-2.1-3.3.5-1-3.2-3.1-1.2.6-3.3L.5 12l2.1-2.6-.6-3.3 3.1-1.2 1-3.2 3.3.5L12 1z" />
        <path d="M9.5 12.5l1.8 1.8 3.7-3.7" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

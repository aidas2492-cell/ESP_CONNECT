import React from 'react';

// Illustration originale (pas une photo) : un·e étudiant·e stylisé·e avec un
// ordinateur portable et une casquette de diplômé, dans un style plat et
// géométrique cohérent avec l'identité visuelle ESPConnect.
export default function StudentIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ombre au sol */}
      <ellipse cx="200" cy="360" rx="110" ry="14" fill="white" fillOpacity="0.08" />

      {/* Sac à dos */}
      <rect x="255" y="200" width="46" height="70" rx="14" fill="white" fillOpacity="0.18" />

      {/* Corps / veste */}
      <path d="M140 260 C140 210 165 185 200 185 C235 185 260 210 260 260 L268 340 L132 340 Z" fill="white" fillOpacity="0.95" />

      {/* Col / t-shirt */}
      <path d="M180 190 L200 215 L220 190 L214 182 L186 182 Z" fill="#2563EB" />

      {/* Bras gauche posé sur l'ordinateur */}
      <path d="M150 250 C130 260 118 275 118 292 L138 300 C142 282 152 268 165 258 Z" fill="white" fillOpacity="0.95" />
      {/* Bras droit */}
      <path d="M250 250 C270 260 282 275 282 292 L262 300 C258 282 248 268 235 258 Z" fill="white" fillOpacity="0.95" />

      {/* Ordinateur portable */}
      <g transform="translate(150 285)">
        <rect x="0" y="0" width="100" height="8" rx="3" fill="#1e3a8a" />
        <path d="M6 -46 H94 V0 H6 Z" fill="#dbeafe" />
        <rect x="6" y="-46" width="88" height="46" rx="4" fill="#1e40af" />
        <rect x="14" y="-38" width="72" height="32" rx="2" fill="#93c5fd" />
      </g>

      {/* Tête */}
      <circle cx="200" cy="150" r="46" fill="#F2C9A0" />

      {/* Cheveux */}
      <path d="M156 140 C150 105 175 85 200 85 C228 85 250 108 244 142 C238 128 224 120 200 120 C178 120 162 128 156 140 Z" fill="#3b2313" />

      {/* Casquette de diplômé */}
      <g transform="translate(200 92)">
        <rect x="-52" y="0" width="104" height="10" rx="4" fill="#1e3a8a" />
        <path d="M-60 -6 L0 -26 L60 -6 L0 14 Z" fill="#2563EB" />
        <circle cx="52" cy="4" r="4" fill="#facc15" />
        <path d="M52 4 C58 20 58 34 50 44" stroke="#facc15" strokeWidth="2.5" fill="none" />
        <circle cx="50" cy="44" r="4" fill="#facc15" />
      </g>

      {/* Sourire simple */}
      <path d="M184 162 Q200 172 216 162" stroke="#7c4a24" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="182" cy="148" r="4" fill="#3b2313" />
      <circle cx="218" cy="148" r="4" fill="#3b2313" />
    </svg>
  );
}

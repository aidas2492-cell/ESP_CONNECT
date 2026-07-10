import React from 'react';

// Bande de photos défilant en continu — service Lorem Picsum (libre de droits,
// stable, sans clé API). À remplacer par de vraies photos du campus ESP
// dès qu'elles seront disponibles (voir README).
const PHOTOS = [
  'campus-1', 'campus-2', 'campus-3', 'campus-4', 'campus-5', 'campus-6', 'campus-7', 'campus-8',
];

export default function PhotoMarquee() {
  const doubled = [...PHOTOS, ...PHOTOS];

  return (
    <div className="relative overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex gap-4 w-max animate-marquee hover:[animation-play-state:paused]">
        {doubled.map((seed, i) => (
          <div key={`${seed}-${i}`} className="h-40 w-64 shrink-0 overflow-hidden rounded-2xl shadow-sm">
            <img
              src={`https://picsum.photos/seed/esp-${seed}/500/320`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 hover:scale-110"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

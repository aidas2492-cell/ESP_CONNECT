import React from 'react';
import StructureCard from './StructureCard';

// Défilement continu (marquee) des structures : on duplique la liste pour
// obtenir une boucle visuelle parfaite via l'animation CSS "marquee".
export default function StructureCarousel({ structures }) {
  if (!structures?.length) return null;
  const doubled = [...structures, ...structures];

  return (
    <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex gap-5 w-max animate-marquee hover:[animation-play-state:paused]">
        {doubled.map((s, i) => (
          <div key={`${s.id}-${i}`} className="w-72 shrink-0">
            <StructureCard structure={s} />
          </div>
        ))}
      </div>
    </div>
  );
}

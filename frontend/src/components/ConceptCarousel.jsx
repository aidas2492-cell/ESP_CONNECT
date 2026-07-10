import React, { useEffect, useState } from 'react';

// Photos via Lorem Picsum (service de placeholders libres de droits, stable
// et sans clé API) — utilisées ici uniquement pour donner un rendu visuel
// vivant en attendant de vraies photos du campus ESP à intégrer plus tard.
const ETAPES = [
  {
    icon: '🔎',
    titre: 'Découvrez les structures',
    texte: "Clubs de département, amicales, commissions sociales : parcourez les 12+ structures actives de l'ESP en un seul endroit.",
    gradient: 'from-primary-600/90 to-primary-900/90',
    photo: 'https://picsum.photos/seed/esp-hero-1/1200/900',
  },
  {
    icon: '🤝',
    titre: 'Demandez à rejoindre',
    texte: "Envoyez une demande d'adhésion en un clic, avec un message optionnel. Le président l'accepte ou la refuse directement depuis son tableau de bord.",
    gradient: 'from-emerald-600/90 to-emerald-900/90',
    photo: 'https://picsum.photos/seed/esp-hero-2/1200/900',
  },
  {
    icon: '📅',
    titre: 'Participez aux événements',
    texte: 'Hackathons, tournois, soirées culturelles : chaque structure publie ses événements avec compte à rebours et rappels automatiques.',
    gradient: 'from-amber-500/90 to-amber-800/90',
    photo: 'https://picsum.photos/seed/esp-hero-3/1200/900',
  },
  {
    icon: '💳',
    titre: 'Payez vos cotisations en ligne',
    texte: 'Réglez vos cotisations directement via Wave ou Orange Money, sans passer par un trésorier physique.',
    gradient: 'from-rose-500/90 to-rose-800/90',
    photo: 'https://picsum.photos/seed/esp-hero-4/1200/900',
  },
  {
    icon: '💬',
    titre: 'Échangez en temps réel',
    texte: 'Un canal de discussion par club, plus vos messages privés et groupes personnalisés — comme sur WhatsApp.',
    gradient: 'from-violet-600/90 to-violet-900/90',
    photo: 'https://picsum.photos/seed/esp-hero-5/1200/900',
  },
];

export default function ConceptCarousel({ compact = false }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % ETAPES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-xl ${compact ? 'aspect-[4/3]' : ''}`}>
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {ETAPES.map((etape) => (
          <div
            key={etape.titre}
            className={`w-full h-full shrink-0 relative overflow-hidden flex flex-col items-center justify-center ${
              compact ? 'px-6 py-8' : 'px-8 py-14 sm:px-16 sm:py-20'
            }`}
          >
            <img src={etape.photo} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className={`absolute inset-0 bg-gradient-to-br ${etape.gradient}`} />
            <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
            <div className="relative max-w-2xl mx-auto text-center">
              <span className={`inline-block ${compact ? 'text-5xl' : 'text-6xl'} drop-shadow-lg`}>{etape.icon}</span>
              <h3 className={`mt-4 font-display font-bold text-white drop-shadow ${compact ? 'text-xl' : 'text-2xl sm:text-3xl mt-6'}`}>{etape.titre}</h3>
              <p className={`mt-3 text-white/95 leading-relaxed drop-shadow ${compact ? 'text-sm' : 'text-base mt-4'}`}>{etape.texte}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Points de navigation */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {ETAPES.map((etape, i) => (
          <button
            key={etape.titre}
            onClick={() => setIndex(i)}
            aria-label={`Aller à l'étape ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}

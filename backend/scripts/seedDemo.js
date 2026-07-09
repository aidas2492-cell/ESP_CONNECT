// Script de données de démonstration pour ESPConnect.
// Crée des structures réalistes (clubs de département + clubs transverses),
// des utilisateurs de test, des adhésions, événements, publications et
// annonces, afin de pouvoir présenter/tester la plateforme avec du contenu.
//
// Usage : node scripts/seedDemo.js
// Le script est idempotent : les comptes de démo utilisent le domaine
// @demo.esp.sn et ne sont recréés que s'ils n'existent pas déjà.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');
const {
  User, Structure, Adhesion, Evenement, Annonce, Cotisation, Post,
} = require('../models');

const dansNJours = (n, heure = 18) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(heure, 0, 0, 0);
  return d;
};

// Photos de démonstration : service de placeholders libres de droits (picsum.photos),
// utilisé uniquement pour donner un rendu visuel réaliste en environnement de test.
const photoDemo = (seed) => `https://picsum.photos/seed/${seed}/800/500`;
const avatarDemo = (seed) => `https://picsum.photos/seed/avatar-${seed}/200/200`;

const STRUCTURES = [
  // --- Clubs liés aux 6 départements de l'ESP ---
  { key: 'gcba', nom: 'Club Génie Chimique et Biologie Appliquée', type: 'club',
    description: "Club du département GCBA : projets de laboratoire, visites industrielles, vulgarisation scientifique." },
  { key: 'civil', nom: 'Club Génie Civil', type: 'club',
    description: "Club du département Génie Civil : visites de chantiers, concours BTP, conférences sur la construction durable." },
  { key: 'elec', nom: 'Club Génie Électrique', type: 'club',
    description: "Club du département Génie Électrique : ateliers électronique, domotique, énergies renouvelables." },
  { key: 'git', nom: 'Club Génie Informatique (GIT)', type: 'club',
    description: "Club du département Génie Informatique : hackathons, formation au code, open-source." },
  { key: 'meca', nom: 'Club Génie Mécanique', type: 'club',
    description: "Club du département Génie Mécanique : robotique, conception CAO, projets moteur." },
  { key: 'gestion', nom: 'Club Gestion', type: 'club',
    description: "Club du département Gestion : entrepreneuriat, finance, ateliers de pitch." },

  // --- Structures transverses, non rattachées à un département ---
  { key: 'humanitaire', nom: 'Club Humanitaire', type: 'commission_sociale',
    description: "Actions solidaires : collectes, dons, aide aux enfants des quartiers voisins de l'ESP." },
  { key: 'sport', nom: 'Club Sport', type: 'club',
    description: "Football, basket, athlétisme et organisation des tournois inter-structures." },
  { key: 'theatre', nom: 'Club Théâtre', type: 'club',
    description: "Représentations, ateliers d'improvisation, la Nuit du Théâtre chaque année." },
  { key: 'alumni', nom: 'Amicale des Anciens (Alumni)', type: 'amicale_etudiants',
    description: "Réseau des diplômés de l'ESP : mentorat, opportunités professionnelles, retrouvailles annuelles." },
  { key: 'personnel', nom: 'Amicale du Personnel', type: 'amicale_personnel',
    description: "Événements et solidarité entre le personnel administratif et enseignant de l'ESP." },
  { key: 'debat', nom: 'Club Débat', type: 'club',
    description: "Joutes oratoires, simulations de l'ONU, ateliers d'éloquence." },
];

const PRENOMS = ['Fatou', 'Moussa', 'Aïssatou', 'Cheikh', 'Marième', 'Ibrahima', 'Sokhna', 'Abdou', 'Awa', 'Ousmane', 'Rokhaya', 'Modou', 'Aminata', 'Lamine', 'Ndeye'];
const NOMS = ['Diop', 'Ndiaye', 'Fall', 'Sy', 'Sarr', 'Ba', 'Gueye', 'Diallo', 'Sène', 'Kane', 'Cissé', 'Faye', 'Thiam', 'Diagne'];

const nomAleatoire = () => ({
  prenom: PRENOMS[Math.floor(Math.random() * PRENOMS.length)],
  nom: NOMS[Math.floor(Math.random() * NOMS.length)],
});

async function creerUtilisateurDemo(email, overrides = {}) {
  let user = await User.findOne({ where: { email } });
  if (user) return user;
  const { prenom, nom } = overrides.prenom ? overrides : nomAleatoire();
  const password = await bcrypt.hash('Demo@2026', 10);
  user = await User.create({
    prenom: overrides.prenom || prenom,
    nom: overrides.nom || nom,
    email,
    password,
    telephone: '+221 77 000 00 00',
    photo: overrides.photo || avatarDemo(email),
    role: 'membre',
  });
  return user;
}

async function run() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('✅ Connexion DB OK, synchronisation des modèles faite.');

  // --- Membres génériques (pool partagé entre toutes les structures) ---
  const membres = [];
  for (let i = 1; i <= 18; i++) {
    const u = await creerUtilisateurDemo(`membre${i}@demo.esp.sn`);
    membres.push(u);
  }
  console.log(`✅ ${membres.length} membres de démonstration prêts.`);

  let compteurStructures = 0;
  let compteurEvenements = 0;
  let compteurPosts = 0;

  for (const def of STRUCTURES) {
    let structure = await Structure.findOne({ where: { nom: def.nom } });
    const president = await creerUtilisateurDemo(`president.${def.key}@demo.esp.sn`);

    if (!structure) {
      structure = await Structure.create({
        nom: def.nom,
        description: def.description,
        type: def.type,
        logo: photoDemo(`club-${def.key}`),
        createur_id: president.id,
      });
      compteurStructures++;
    }

    // Le président : adhésion active avec rôle président
    await Adhesion.findOrCreate({
      where: { user_id: president.id, structure_id: structure.id },
      defaults: { role_structure: 'president', statut: 'active', date_traitement: new Date() },
    });

    // 5 à 8 membres actifs tirés au hasard dans le pool, + 1-2 demandes en attente
    const melange = [...membres].sort(() => 0.5 - Math.random());
    const actifs = melange.slice(0, 6);
    const enAttente = melange.slice(6, 8);

    for (const m of actifs) {
      await Adhesion.findOrCreate({
        where: { user_id: m.id, structure_id: structure.id },
        defaults: { role_structure: 'membre', statut: 'active', date_traitement: new Date() },
      });
    }
    for (const m of enAttente) {
      await Adhesion.findOrCreate({
        where: { user_id: m.id, structure_id: structure.id },
        defaults: { role_structure: 'membre', statut: 'en_attente', message: "Je souhaite m'investir dans les activités du club." },
      });
    }

    // Un événement à venir par structure
    const existeDejaEvenement = await Evenement.findOne({ where: { structure_id: structure.id } });
    if (!existeDejaEvenement) {
      await Evenement.create({
        structure_id: structure.id,
        titre: `Réunion de rentrée — ${def.nom}`,
        description: `Présentation des activités de l'année et recrutement de nouveaux membres pour ${def.nom}.`,
        date_debut: dansNJours(5 + Math.floor(Math.random() * 20)),
        lieu: 'Amphi A, ESP Dakar',
        image: photoDemo(`event-${def.key}`),
      });
      compteurEvenements++;
    }

    // Une annonce avec échéance (pour le compte à rebours)
    const existeDejaAnnonce = await Annonce.findOne({ where: { structure_id: structure.id } });
    if (!existeDejaAnnonce) {
      await Annonce.create({
        structure_id: structure.id,
        titre: `Inscriptions ouvertes — ${def.nom}`,
        contenu: `Les inscriptions pour rejoindre ${def.nom} sont ouvertes. Places limitées, ne tardez pas à faire votre demande d'adhésion !`,
        date_echeance: dansNJours(10),
      });
    }

    // Une cotisation pour les membres actifs
    const existeDejaCotisation = await Cotisation.findOne({ where: { structure_id: structure.id } });
    if (!existeDejaCotisation) {
      for (const m of actifs) {
        await Cotisation.create({
          structure_id: structure.id,
          user_id: m.id,
          montant: 2000,
          date_echeance: dansNJours(15),
          statut: Math.random() > 0.5 ? 'payee' : 'en_attente',
          date_paiement: Math.random() > 0.5 ? new Date() : null,
        });
      }
    }

    // Un post du président sur le fil de campus
    const dejaPublie = await Post.findOne({ where: { structure_id: structure.id } });
    if (!dejaPublie) {
      await Post.create({
        user_id: president.id,
        structure_id: structure.id,
        contenu: `${def.nom} recrute ! Rejoignez-nous cette année pour des activités passionnantes. #${def.key} #ESP2026`,
        image: Math.random() > 0.3 ? photoDemo(`post-${def.key}`) : null,
        hashtags: [def.key, 'ESP2026'],
        lieu: 'ESP Dakar',
      });
      compteurPosts++;
    }
  }

  // Quelques posts additionnels génériques sur le fil pour peupler les tendances
  const postsGeneriques = [
    { contenu: "Victoire 4-1 face à l'UCAD hier soir ! Bravo à toute l'équipe 🎉 #football #victoire #campus", tag: 'sport' },
    { contenu: "Rappel : la collecte de fournitures pour les enfants du quartier se termine vendredi. Déjà 240 kits réunis 🙏 #solidarite #don", tag: 'humanitaire' },
    { contenu: "Hackathon ESP 2026 — 48h de code, 500 000 FCFA à gagner, inscriptions ouvertes ! #hackathon2026 #dev", tag: 'git' },
    { contenu: "Répétition générale ce soir pour la nouvelle pièce. Première samedi 20h en salle B12 🎭 #nuitdutheatre", tag: 'theatre' },
  ];

  const toutesLesStructures = await Structure.findAll();

  for (const p of postsGeneriques) {
    const structureAleatoire = toutesLesStructures[Math.floor(Math.random() * toutesLesStructures.length)];
    const auteur = membres[Math.floor(Math.random() * membres.length)];
    const dejaExiste = await Post.findOne({ where: { contenu: p.contenu } });
    if (!dejaExiste) {
      await Post.create({
        user_id: auteur.id,
        structure_id: structureAleatoire?.id || null,
        contenu: p.contenu,
        hashtags: p.contenu.match(/#[\p{L}0-9_]+/gu)?.map((h) => h.slice(1).toLowerCase()) || [],
        image: photoDemo(`generic-${p.tag}`),
      });
      compteurPosts++;
    }
  }

  console.log(`✅ ${compteurStructures} nouvelle(s) structure(s) créée(s) (${STRUCTURES.length} au total visées).`);
  console.log(`✅ ${compteurEvenements} nouvel(s) événement(s) créé(s).`);
  console.log(`✅ ${compteurPosts} nouvelle(s) publication(s) créée(s) sur le fil.`);
  console.log('');
  console.log('Comptes de démonstration (mot de passe : Demo@2026) :');
  console.log('  - Présidents : president.<club>@demo.esp.sn (ex: president.git@demo.esp.sn)');
  console.log('  - Membres    : membre1@demo.esp.sn à membre18@demo.esp.sn');
  console.log('  - Admin      : admin@esp.sn / Admin@2026 (créé via npm run create-admin)');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Erreur pendant le seed:', err);
  process.exit(1);
});

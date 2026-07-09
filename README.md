# ESPConnect — Plateforme de digitalisation des structures de l'ESP

Application complète (React + Node.js/Express + MySQL) permettant aux clubs, amicales
et commissions de l'ESP de gérer leurs membres, événements, annonces, cotisations et
messagerie de groupe en temps réel.

## 📁 Structure du projet

```
espconnect/
├── backend/     → API Express (REST + WebSocket)
└── frontend/    → Application React (Vite + Tailwind)
```

---

## 1. Prérequis à installer sur votre ordinateur

| Outil | Version conseillée | Vérifier avec |
|---|---|---|
| Node.js | 18 ou 20 LTS | `node -v` |
| npm | fourni avec Node | `npm -v` |
| MySQL | 8.x (ou MariaDB 10.6+) | `mysql --version` |
| Git (optionnel) | dernière version | `git --version` |

Si Node.js ou MySQL ne sont pas installés :
- Node.js : https://nodejs.org (choisir la version LTS)
- MySQL : https://dev.mysql.com/downloads/installer/ (Windows) ou `brew install mysql` (Mac) ou `sudo apt install mysql-server` (Linux)

---

## 2. Créer la base de données

Ouvrez un terminal MySQL (`mysql -u root -p`) et exécutez :

```sql
CREATE DATABASE esp_digital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Vous n'avez rien d'autre à créer manuellement : les tables sont générées automatiquement
au démarrage du serveur grâce à Sequelize (`sequelize.sync`).

---

## 3. Installer et lancer le backend

```bash
cd espconnect/backend
npm install
cp .env.example .env
```

Ouvrez `.env` et renseignez au minimum :

```
DB_NAME=esp_digital
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
JWT_SECRET=une_longue_chaine_secrete_aleatoire
```

Puis démarrez le serveur :

```bash
npm run dev
```

Vous devriez voir :

```
✅ Connexion à la base de données MySQL réussie.
✅ Modèles synchronisés avec la base de données.
🚀 Serveur ESP Digital (API + WebSocket) à l'écoute sur http://localhost:5000
```

### Créer un compte administrateur

Dans un autre terminal (toujours dans `espconnect/backend`) :

```bash
npm run create-admin
```

Cela crée le compte :
- Email : `admin@esp.sn`
- Mot de passe : `Admin@2026`

⚠️ Changez ce mot de passe dès votre première connexion (page Profil).

### Remplir la plateforme avec des données de démonstration

Pour présenter ou tester l'application avec du contenu réaliste (les 6 clubs de
département de l'ESP + 6 structures transverses, des membres, présidents,
événements, annonces, cotisations et publications sur le fil) :

```bash
npm run seed-demo
```

Comptes créés (mot de passe unique : `Demo@2026`) :
- Présidents de club : `president.git@demo.esp.sn`, `president.civil@demo.esp.sn`,
  `president.elec@demo.esp.sn`, `president.meca@demo.esp.sn`,
  `president.gcba@demo.esp.sn`, `president.gestion@demo.esp.sn`, ainsi que pour
  les clubs transverses (`president.sport@demo.esp.sn`, `president.humanitaire@demo.esp.sn`, etc.)
- Membres génériques : `membre1@demo.esp.sn` à `membre18@demo.esp.sn`

Le script est rejouable sans dupliquer les données (il vérifie l'existence
avant de créer). Les images utilisées sont des photos de démonstration libres
de droits (picsum.photos) — à remplacer par vos propres visuels en production.

---

## 4. Installer et lancer le frontend

Dans un **nouveau terminal** :

```bash
cd espconnect/frontend
npm install
npm run dev
```

Le site est accessible sur **http://localhost:5173**. Il communique automatiquement
avec le backend sur le port 5000 grâce au proxy configuré dans `vite.config.js`
(aucune configuration `.env` n'est nécessaire en local).

---

## 5. Utilisation rapide

1. Ouvrez http://localhost:5173
2. Créez un compte (bouton "S'inscrire") → vous devenez **Membre**
3. Depuis votre tableau de bord, cliquez sur **"Créer une structure"** → vous en devenez
   automatiquement **Président** et accédez à un espace de gestion dédié
   (`/president/:structureId`)
4. Connectez-vous avec `admin@esp.sn` / `Admin@2026` pour accéder à l'espace
   **Administrateur** (`/admin`)

Fonctionnalités couvertes :
- Authentification (inscription, connexion, JWT, rôles, désactivation de compte)
- Visiteur : consultation des structures et événements publics, recherche/filtre
- Membre : adhésion, quitter une structure, participer à un événement, payer une
  cotisation (redirection Wave / Orange Money), notifications, profil
- Président : créer/modifier/supprimer sa structure, valider/rejeter les demandes,
  retirer un membre, publier événements/annonces (avec compte à rebours), définir des
  cotisations, informer ses membres, messagerie de groupe en temps réel
- Administrateur : statistiques globales, gestion des utilisateurs (rôles,
  désactivation, suppression), gestion des structures/événements, journal d'activités
- Interface : mode sombre, changement de langue FR/EN, carrousel animé des structures,
  comptes à rebours sur événements et annonces, toasts, pagination, modales de
  confirmation
- Fil du campus (`/fil`) : publications avec photo/lieu/hashtags, likes, commentaires,
  tendances calculées sur les vraies publications, "membres à l'honneur" basé sur
  l'activité réelle (posts + likes reçus), galerie photo alimentée par les publications
- Messagerie privée (`/messages`) : messages directs entre deux membres et groupes
  personnalisés façon WhatsApp (nom, membres choisis librement), en plus du canal de
  discussion de chaque club (onglet "Messagerie" d'une structure) — tout en temps réel
  via Socket.IO

---

## 6. À propos du paiement Wave / Orange Money

Le composant `PaymentModal` ouvre un lien de paiement Wave / Orange Money dans un
nouvel onglet, puis vous demande de confirmer une fois le paiement effectué. C'est un
**flux de démonstration** : pour un vrai encaissement en production, il faut :

1. Créer un compte marchand Wave Business et/ou Orange Money API
2. Remplacer les URLs dans `frontend/src/components/PaymentModal.jsx`
   (`buildWaveLink` / `buildOrangeMoneyLink`) par les vrais liens marchands générés
   côté serveur avec vos identifiants API
3. Idéalement, faire confirmer le paiement par un **webhook serveur** (Wave/Orange
   Money notifient votre backend) plutôt que par une simple confirmation manuelle
   côté client

---

## 7. Déploiement (hébergement)

Une architecture simple et gratuite/peu coûteuse pour démarrer :

| Composant | Hébergeur suggéré |
|---|---|
| Backend (Node.js + WebSocket) | Render.com, Railway.app ou un VPS |
| Base de données MySQL | Railway, Clever Cloud, ou PlanetScale (MySQL compatible) |
| Frontend (React buildé) | Vercel ou Netlify |

### Backend (exemple avec Render.com)
1. Poussez le dossier `backend/` sur un dépôt Git
2. Sur Render : New → Web Service → connectez le repo
3. Build command : `npm install` — Start command : `npm start`
4. Renseignez toutes les variables de `.env` dans l'onglet "Environment"
5. Notez l'URL générée, ex : `https://esp-connect-api.onrender.com`

### Frontend (exemple avec Vercel)
1. Poussez le dossier `frontend/` sur un dépôt Git
2. Sur Vercel : Import project → sélectionnez le repo
3. Dans les variables d'environnement, ajoutez :
   ```
   VITE_API_URL=https://esp-connect-api.onrender.com/api
   VITE_SOCKET_URL=https://esp-connect-api.onrender.com
   ```
4. Déployez. Mettez ensuite à jour `CLIENT_URL` dans le `.env` du backend avec l'URL
   Vercel obtenue, pour que CORS et Socket.IO autorisent bien le frontend.

---

## 8. Dépannage rapide

- **`ECONNREFUSED` / le frontend n'arrive pas à joindre l'API** → vérifiez que le
  backend tourne bien sur le port 5000 (`npm run dev` dans `backend/`).
- **Erreur MySQL `Access denied`** → vérifiez `DB_USER` / `DB_PASSWORD` dans `.env`.
- **Le chat en temps réel ne se connecte pas** → vérifiez que `/socket.io` est bien
  proxifié (dev) ou que `VITE_SOCKET_URL` pointe vers le bon backend (prod), et que
  `CLIENT_URL` côté backend correspond à l'URL exacte du frontend.
- **Images non affichées** → le dossier `backend/uploads` doit exister et être
  accessible ; il est servi automatiquement sur `/uploads`.

## 9. Qui peut créer une structure ?

Par défaut, **aucun membre ne peut créer de structure** tant qu'un administrateur
n'a pas désigné l'**organe central (le CEE)** : allez dans `/admin` → onglet
"Structures" → cliquez sur "Désigner comme CEE" à côté de la structure
concernée (créez-la d'abord si elle n'existe pas encore — un administrateur
peut toujours créer n'importe quelle structure, quel que soit l'organe central
configuré).

Une fois cela fait, **seul le président de cette structure** pourra créer de
nouvelles structures depuis son tableau de bord Membre ; les autres membres
verront un message expliquant qui contacter à la place.

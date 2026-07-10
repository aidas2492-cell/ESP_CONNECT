# db/

Ce dossier contient le **schéma SQL** de la base de données MySQL utilisée par
ESPConnect (`schema.sql`), pour qu'il soit visible et versionné dans le dépôt
— comme un vrai document — plutôt que caché dans une base locale invisible.

## Ce fichier n'est pas obligatoire pour faire fonctionner l'application

Le backend crée déjà automatiquement toutes les tables au démarrage grâce à
Sequelize (`sequelize.sync()` dans `backend/server.js`), à partir des modèles
définis dans `backend/models/`. Il suffit d'avoir une base `esp_digital` vide
et de lancer `npm run dev`.

## À quoi sert `schema.sql` alors ?

- **Documentation** : voir d'un coup d'œil toutes les tables, colonnes,
  types et relations du projet, sans avoir à lancer l'application.
- **Visibilité sur GitHub** : le schéma de la base fait partie du dépôt, comme
  demandé, au lieu d'exister uniquement sur la machine de chacun.
- **Installation manuelle alternative**, si vous préférez ne pas dépendre du
  `sync()` automatique :
  ```bash
  mysql -u root -p < db/schema.sql
  ```
  (crée la base `esp_digital` si besoin, puis toutes les tables)

## Important

`schema.sql` définit la **structure** des tables (colonnes, types, relations),
pas les données elles-mêmes. Pour peupler la base avec du contenu de
démonstration, utilisez toujours :

```bash
cd backend
npm run seed-demo
```

Si vous modifiez un modèle dans `backend/models/`, pensez à mettre à jour
`schema.sql` en conséquence pour qu'il reste le reflet fidèle du modèle
Sequelize.

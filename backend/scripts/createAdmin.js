// Script utilitaire : crée un compte administrateur par défaut.
// Usage : node scripts/createAdmin.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');
const { User } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const email = 'admin@esp.sn';
    const existant = await User.findOne({ where: { email } });

    if (existant) {
      console.log('ℹ️  Un administrateur existe déjà avec cet email:', email);
      process.exit(0);
    }

    const password = await bcrypt.hash('Admin@2026', 10);

    await User.create({
      nom: 'Administrateur',
      prenom: 'ESP',
      email,
      password,
      role: 'admin',
    });

    console.log('✅ Compte administrateur créé.');
    console.log('   Email    :', email);
    console.log('   Mot de passe : Admin@2026');
    console.log('   ⚠️  Changez ce mot de passe après la première connexion.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();

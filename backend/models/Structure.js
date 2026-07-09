const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Structure = sequelize.define('Structure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('club', 'amicale_etudiants', 'amicale_personnel', 'commission_sociale'),
    defaultValue: 'club',
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // Marque la structure "mère" (le CEE) : seul son président peut créer de
  // nouvelles structures sur la plateforme. Une seule structure doit porter
  // ce drapeau à la fois (géré par l'Administrateur).
  est_organe_central: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Structure;

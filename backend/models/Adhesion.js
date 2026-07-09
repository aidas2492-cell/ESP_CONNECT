const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Représente à la fois la demande d'adhésion et l'adhésion effective
// d'un utilisateur à une structure (cf. cas d'utilisation "Adhérer une structure").
const Adhesion = sequelize.define('Adhesion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_structure: {
    type: DataTypes.ENUM('membre', 'president'),
    defaultValue: 'membre',
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'active', 'rejetee', 'quittee'),
    defaultValue: 'en_attente',
  },
  date_demande: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  date_traitement: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  message: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
}, {
  indexes: [
    { unique: true, fields: ['user_id', 'structure_id'] },
  ],
});

module.exports = Adhesion;

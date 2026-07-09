const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Une conversation privée : soit "direct" (1 à 1 entre deux membres), soit
// "group" (un groupe personnalisé créé par un utilisateur, à la WhatsApp,
// avec un nom et des membres choisis librement — indépendant des structures).
const DMConversation = sequelize.define('DMConversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: true, // requis uniquement pour les groupes
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = DMConversation;

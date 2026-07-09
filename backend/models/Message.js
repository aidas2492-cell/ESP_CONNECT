const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Messagerie de groupe : un message appartient à une structure (le "groupe")
// et à son auteur. Tous les membres actifs de la structure peuvent lire
// et écrire dans ce fil de discussion.
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = Message;

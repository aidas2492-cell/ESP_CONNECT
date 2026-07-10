const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lue: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lien: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date_envoie: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  categorie: {
    // Permet de filtrer les notifications par onglet, façon LinkedIn.
    type: DataTypes.ENUM('mention', 'reaction', 'invitation', 'general'),
    defaultValue: 'general',
  },
});

module.exports = Notification;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Une connexion entre deux membres (façon LinkedIn), indépendante de toute
// adhésion à une structure. demandeur_id envoie la demande à destinataire_id ;
// une fois acceptée, la connexion est symétrique (visible dans les deux sens).
const Connection = sequelize.define('Connection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'acceptee', 'refusee'),
    defaultValue: 'en_attente',
  },
}, {
  indexes: [
    { unique: true, fields: ['demandeur_id', 'destinataire_id'] },
  ],
});

module.exports = Connection;

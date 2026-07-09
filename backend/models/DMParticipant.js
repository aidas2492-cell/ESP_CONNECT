const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DMParticipant = sequelize.define('DMParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'membre'),
    defaultValue: 'membre',
  },
  dernierAccesA: {
    // Utilisé pour calculer le nombre de messages non lus par conversation.
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  indexes: [
    { unique: true, fields: ['conversation_id', 'user_id'] },
  ],
});

module.exports = DMParticipant;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Journal d'activités consulté par l'Administrateur : trace les actions
// importantes (création de structure, adhésion validée, cotisation payée...).
const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = ActivityLog;

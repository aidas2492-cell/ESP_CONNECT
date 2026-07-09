const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Annonce = sequelize.define('Annonce', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  date_publication: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  date_echeance: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Annonce;

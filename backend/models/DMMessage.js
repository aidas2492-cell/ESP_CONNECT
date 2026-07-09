const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DMMessage = sequelize.define('DMMessage', {
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

module.exports = DMMessage;

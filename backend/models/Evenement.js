const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evenement = sequelize.define('Evenement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  date_debut: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  date_fin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lieu: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  validate: {
    dateFinApresDateDebut() {
      if (this.date_fin && this.date_debut && this.date_fin < this.date_debut) {
        throw new Error("La date de fin doit être postérieure à la date de début.");
      }
    },
  },
});

module.exports = Evenement;

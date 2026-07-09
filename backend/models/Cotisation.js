const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cotisation = sequelize.define('Cotisation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  date_echeance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'payee', 'en_retard'),
    defaultValue: 'en_attente',
  },
  mode_paiement: {
    type: DataTypes.ENUM('especes', 'wave', 'orange_money', 'virement'),
    allowNull: true,
  },
  date_paiement: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Cotisation;

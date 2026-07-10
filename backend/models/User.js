const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Rôle global sur la plateforme. Le rôle "président" est porté par la
  // relation Adhesion (role_structure) car un utilisateur peut être
  // président d'une structure et simple membre d'une autre.
  role: {
    type: DataTypes.ENUM('membre', 'admin'),
    defaultValue: 'membre',
  },
  date_inscription: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  photo_couverture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bio: {
    // "Titre" façon LinkedIn, ex: "Étudiant en Génie Informatique @ ESP Dakar"
    type: DataTypes.STRING(160),
    allowNull: true,
  },
  a_propos: {
    // Paragraphe "À propos" plus long
    type: DataTypes.TEXT,
    allowNull: true,
  },
  competences: {
    // Liste de compétences façon LinkedIn, ex: ["React","Gestion de projet"]
    type: DataTypes.JSON,
    defaultValue: [],
  },
  promotion: {
    // Ex: "2024CSED" — utile pour le réseau alumni
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;

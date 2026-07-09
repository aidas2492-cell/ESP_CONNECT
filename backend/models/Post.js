const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Une publication du fil de campus. Peut être postée par un membre en son nom
// propre, ou "au nom de sa structure" (ex: le président d'un club) via
// structure_id, pour afficher le badge du rôle (Président, Capitaine...).
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hashtags: {
    // Stockés en JSON simple, ex: ["hackathon2026","campusvert"]
    type: DataTypes.JSON,
    defaultValue: [],
  },
  lieu: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Post;

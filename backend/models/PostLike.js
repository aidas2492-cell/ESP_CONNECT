const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Association utilisateur ↔ publication pour les réactions façon LinkedIn
// (👍 ❤️ 👏 🎉 au lieu d'un simple "J'aime"). Un utilisateur ne peut avoir
// qu'une seule réaction active par publication (contrainte unique ci-dessous) ;
// changer de réaction met simplement à jour le type existant.
const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('jaime', 'jadore', 'bravo', 'super'),
    defaultValue: 'jaime',
  },
}, {
  indexes: [
    { unique: true, fields: ['user_id', 'post_id'] },
  ],
});

module.exports = PostLike;

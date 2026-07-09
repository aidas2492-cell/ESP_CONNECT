const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Association simple utilisateur ↔ publication pour les "J'aime".
const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  indexes: [
    { unique: true, fields: ['user_id', 'post_id'] },
  ],
});

module.exports = PostLike;

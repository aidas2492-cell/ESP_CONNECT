const sequelize = require('../config/database');
const User = require('./User');
const Structure = require('./Structure');
const Adhesion = require('./Adhesion');
const Evenement = require('./Evenement');
const Annonce = require('./Annonce');
const Cotisation = require('./Cotisation');
const Notification = require('./Notification');
const Message = require('./Message');
const ActivityLog = require('./ActivityLog');
const Post = require('./Post');
const PostLike = require('./PostLike');
const PostComment = require('./PostComment');
const DMConversation = require('./DMConversation');
const DMParticipant = require('./DMParticipant');
const DMMessage = require('./DMMessage');

// --- Utilisateur <-> Structure via Adhesion (relation "adhère à") ---
User.belongsToMany(Structure, { through: Adhesion, foreignKey: 'user_id', as: 'structures' });
Structure.belongsToMany(User, { through: Adhesion, foreignKey: 'structure_id', as: 'membres' });

User.hasMany(Adhesion, { foreignKey: 'user_id', as: 'adhesions' });
Adhesion.belongsTo(User, { foreignKey: 'user_id', as: 'utilisateur' });

Structure.hasMany(Adhesion, { foreignKey: 'structure_id', as: 'adhesions' });
Adhesion.belongsTo(Structure, { foreignKey: 'structure_id', as: 'structure' });

// Créateur d'une structure (le premier président)
Structure.belongsTo(User, { foreignKey: 'createur_id', as: 'createur' });

// --- Structure -> Evenement ("organise") ---
Structure.hasMany(Evenement, { foreignKey: 'structure_id', as: 'evenements', onDelete: 'CASCADE' });
Evenement.belongsTo(Structure, { foreignKey: 'structure_id', as: 'structure' });

// --- Structure -> Annonce ("publie") ---
Structure.hasMany(Annonce, { foreignKey: 'structure_id', as: 'annonces', onDelete: 'CASCADE' });
Annonce.belongsTo(Structure, { foreignKey: 'structure_id', as: 'structure' });

// --- User -> Cotisation ("paie") , Structure -> Cotisation ---
User.hasMany(Cotisation, { foreignKey: 'user_id', as: 'cotisations' });
Cotisation.belongsTo(User, { foreignKey: 'user_id', as: 'membre' });
Structure.hasMany(Cotisation, { foreignKey: 'structure_id', as: 'cotisations' });
Cotisation.belongsTo(Structure, { foreignKey: 'structure_id', as: 'structure' });

// --- User -> Notification ("reçoit") ---
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'destinataire' });

// --- Messagerie de groupe : Structure -> Message <- User ---
Structure.hasMany(Message, { foreignKey: 'structure_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Structure, { foreignKey: 'structure_id', as: 'structure' });
User.hasMany(Message, { foreignKey: 'user_id', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'user_id', as: 'auteur' });

// --- Journal d'activités : rattaché à l'utilisateur qui a déclenché l'action ---
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activites' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'utilisateur' });

// --- Fil de campus : Post, likes, commentaires ---
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'auteur' });

Structure.hasMany(Post, { foreignKey: 'structure_id', as: 'posts' });
Post.belongsTo(Structure, { foreignKey: 'structure_id', as: 'structure' });

Post.hasMany(PostLike, { foreignKey: 'post_id', as: 'likes', onDelete: 'CASCADE' });
PostLike.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
User.hasMany(PostLike, { foreignKey: 'user_id', as: 'jaimes' });
PostLike.belongsTo(User, { foreignKey: 'user_id', as: 'utilisateur' });

Post.hasMany(PostComment, { foreignKey: 'post_id', as: 'commentaires', onDelete: 'CASCADE' });
PostComment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
User.hasMany(PostComment, { foreignKey: 'user_id', as: 'mesCommentaires' });
PostComment.belongsTo(User, { foreignKey: 'user_id', as: 'auteur' });

// --- Messagerie privée : conversations directes et groupes personnalisés ---
DMConversation.hasMany(DMParticipant, { foreignKey: 'conversation_id', as: 'participants', onDelete: 'CASCADE' });
DMParticipant.belongsTo(DMConversation, { foreignKey: 'conversation_id', as: 'conversation' });
User.hasMany(DMParticipant, { foreignKey: 'user_id', as: 'mesParticipations' });
DMParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'utilisateur' });

DMConversation.hasMany(DMMessage, { foreignKey: 'conversation_id', as: 'messages', onDelete: 'CASCADE' });
DMMessage.belongsTo(DMConversation, { foreignKey: 'conversation_id', as: 'conversation' });
User.hasMany(DMMessage, { foreignKey: 'user_id', as: 'mesMessagesDM' });
DMMessage.belongsTo(User, { foreignKey: 'user_id', as: 'auteur' });

module.exports = {
  sequelize,
  User,
  Structure,
  Adhesion,
  Evenement,
  Annonce,
  Cotisation,
  Notification,
  Message,
  ActivityLog,
  Post,
  PostLike,
  PostComment,
  DMConversation,
  DMParticipant,
  DMMessage,
};

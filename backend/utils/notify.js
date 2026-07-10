const { Notification } = require('../models');
const { emitNotification } = require('./socket');

exports.creerNotification = async ({ userId, titre, message, lien = null, categorie = 'general' }) => {
  const notification = await Notification.create({
    user_id: userId,
    titre,
    message,
    lien,
    categorie,
  });
  emitNotification(userId, notification);
  return notification;
};

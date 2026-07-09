const { Notification } = require('../models');
const { emitNotification } = require('./socket');

exports.creerNotification = async ({ userId, titre, message, lien = null }) => {
  const notification = await Notification.create({
    user_id: userId,
    titre,
    message,
    lien,
  });
  emitNotification(userId, notification);
  return notification;
};

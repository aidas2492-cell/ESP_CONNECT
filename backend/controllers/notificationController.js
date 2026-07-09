const { Notification } = require('../models');

// GET /api/notifications — l'utilisateur connecté consulte ses notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['date_envoie', 'DESC']],
    });
    const nonLues = notifications.filter((n) => !n.lue).length;
    return res.json({ notifications, nonLues });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des notifications.', error: error.message });
  }
};

// PUT /api/notifications/:id/lue — marquer une notification comme lue
exports.marquerCommeLue = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!notification) return res.status(404).json({ message: 'Notification introuvable.' });
    notification.lue = true;
    await notification.save();
    return res.json({ message: 'Notification marquée comme lue.', notification });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

// PUT /api/notifications/tout-lire — tout marquer comme lu
exports.toutMarquerCommeLu = async (req, res) => {
  try {
    await Notification.update({ lue: true }, { where: { user_id: req.user.id, lue: false } });
    return res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

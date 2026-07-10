const { Notification } = require('../models');

// GET /api/notifications?categorie= — l'utilisateur connecté consulte ses notifications,
// avec un filtre optionnel par catégorie (mention/reaction/invitation/general)
exports.getMyNotifications = async (req, res) => {
  try {
    const where = { user_id: req.user.id };
    if (req.query.categorie && req.query.categorie !== 'toutes') {
      where.categorie = req.query.categorie;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['date_envoie', 'DESC']],
    });
    const toutes = await Notification.findAll({ where: { user_id: req.user.id }, attributes: ['categorie', 'lue'] });
    const nonLues = toutes.filter((n) => !n.lue).length;

    const compteurParCategorie = { mention: 0, reaction: 0, invitation: 0, general: 0 };
    toutes.forEach((n) => { if (!n.lue) compteurParCategorie[n.categorie] = (compteurParCategorie[n.categorie] || 0) + 1; });

    return res.json({ notifications, nonLues, compteurParCategorie });
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

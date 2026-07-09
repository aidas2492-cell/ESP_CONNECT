const { Message, Adhesion, User } = require('../models');
const { emitNewMessage } = require('../utils/socket');

// GET /api/structures/:id/messages — messages du groupe (réservé aux membres actifs)
exports.getMessages = async (req, res) => {
  try {
    const structureId = req.params.id;

    const estMembre = await Adhesion.findOne({
      where: { user_id: req.user.id, structure_id: structureId, statut: 'active' },
    });
    if (!estMembre) {
      return res.status(403).json({ message: 'Réservé aux membres de la structure.' });
    }

    const messages = await Message.findAll({
      where: { structure_id: structureId },
      include: [{ model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] }],
      order: [['createdAt', 'ASC']],
      limit: 200,
    });

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des messages.', error: error.message });
  }
};

// POST /api/structures/:id/messages — envoyer un message au groupe
exports.postMessage = async (req, res) => {
  try {
    const structureId = req.params.id;
    const { contenu } = req.body;

    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide.' });
    }

    const estMembre = await Adhesion.findOne({
      where: { user_id: req.user.id, structure_id: structureId, statut: 'active' },
    });
    if (!estMembre) {
      return res.status(403).json({ message: 'Réservé aux membres de la structure.' });
    }

    const message = await Message.create({
      structure_id: structureId,
      user_id: req.user.id,
      contenu: contenu.trim(),
    });

    const messageComplet = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] }],
    });

    emitNewMessage(structureId, messageComplet);

    return res.status(201).json({ message: messageComplet });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'envoi du message.", error: error.message });
  }
};

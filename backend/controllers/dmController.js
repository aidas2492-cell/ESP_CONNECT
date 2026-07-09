const { Op } = require('sequelize');
const { DMConversation, DMParticipant, DMMessage, User } = require('../models');
const { emitDMMessage } = require('../utils/socket');

// GET /api/messages/utilisateurs?search= — chercher un membre pour démarrer une conversation
exports.rechercherUtilisateurs = async (req, res) => {
  try {
    const { search } = req.query;
    const where = { id: { [Op.ne]: req.user.id }, actif: true };
    if (search) {
      where[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { prenom: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    const utilisateurs = await User.findAll({
      where,
      attributes: ['id', 'nom', 'prenom', 'photo', 'email'],
      limit: 20,
    });
    return res.json({ utilisateurs });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la recherche.', error: error.message });
  }
};

// GET /api/messages/conversations — mes conversations (directes + groupes), triées par activité récente
exports.getMesConversations = async (req, res) => {
  try {
    const participations = await DMParticipant.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: DMConversation,
          as: 'conversation',
          include: [
            {
              model: DMParticipant,
              as: 'participants',
              include: [{ model: User, as: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'photo'] }],
            },
            {
              model: DMMessage,
              as: 'messages',
              limit: 1,
              order: [['createdAt', 'DESC']],
              include: [{ model: User, as: 'auteur', attributes: ['id', 'prenom'] }],
            },
          ],
        },
      ],
    });

    const conversations = participations
      .map((p) => {
        const conv = p.conversation;
        const dernierMessage = conv.messages?.[0] || null;
        const autresParticipants = conv.participants
          .filter((part) => part.user_id !== req.user.id)
          .map((part) => part.utilisateur);

        return {
          id: conv.id,
          type: conv.type,
          nom: conv.type === 'group' ? conv.nom : `${autresParticipants[0]?.prenom || ''} ${autresParticipants[0]?.nom || ''}`.trim(),
          image: conv.type === 'group' ? conv.image : autresParticipants[0]?.photo,
          participants: conv.participants.map((part) => part.utilisateur),
          dernierMessage: dernierMessage
            ? { contenu: dernierMessage.contenu, auteur: dernierMessage.auteur?.prenom, createdAt: dernierMessage.createdAt }
            : null,
          nonLu: dernierMessage ? new Date(dernierMessage.createdAt) > new Date(p.dernierAccesA) : false,
          updatedAt: dernierMessage?.createdAt || conv.createdAt,
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.json({ conversations });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des conversations.', error: error.message });
  }
};

// POST /api/messages/conversations/direct — { userId } : démarre (ou récupère) une conversation 1-à-1
exports.creerOuRecupererDirect = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Destinataire invalide.' });
    }

    const destinataire = await User.findByPk(userId);
    if (!destinataire) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    // Cherche une conversation directe existante entre les deux utilisateurs
    const mesParticipations = await DMParticipant.findAll({
      where: { user_id: req.user.id },
      include: [{ model: DMConversation, as: 'conversation', where: { type: 'direct' } }],
    });

    for (const p of mesParticipations) {
      const autre = await DMParticipant.findOne({
        where: { conversation_id: p.conversation_id, user_id: userId },
      });
      if (autre) {
        return res.json({ conversation: { id: p.conversation_id, existante: true } });
      }
    }

    const conversation = await DMConversation.create({ type: 'direct' });
    await DMParticipant.bulkCreate([
      { conversation_id: conversation.id, user_id: req.user.id },
      { conversation_id: conversation.id, user_id: userId },
    ]);

    return res.status(201).json({ conversation: { id: conversation.id, existante: false } });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la création de la conversation.', error: error.message });
  }
};

// POST /api/messages/conversations/group — { nom, memberIds: [] } : crée un groupe façon WhatsApp
exports.creerGroupe = async (req, res) => {
  try {
    const { nom, memberIds = [] } = req.body;
    if (!nom || !nom.trim()) return res.status(400).json({ message: 'Le nom du groupe est requis.' });

    const membresUniques = [...new Set([req.user.id, ...memberIds.map((id) => parseInt(id))])];
    if (membresUniques.length < 2) {
      return res.status(400).json({ message: 'Choisissez au moins un autre membre pour créer un groupe.' });
    }

    const conversation = await DMConversation.create({ type: 'group', nom: nom.trim() });
    await DMParticipant.bulkCreate(
      membresUniques.map((id) => ({
        conversation_id: conversation.id,
        user_id: id,
        role: id === req.user.id ? 'admin' : 'membre',
      }))
    );

    return res.status(201).json({ message: 'Groupe créé avec succès.', conversation: { id: conversation.id } });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la création du groupe.', error: error.message });
  }
};

// POST /api/messages/conversations/:id/membres — { userId } : ajouter un membre (admin du groupe uniquement)
exports.ajouterMembre = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { userId } = req.body;

    const monRole = await DMParticipant.findOne({ where: { conversation_id: conversationId, user_id: req.user.id } });
    if (!monRole || monRole.role !== 'admin') {
      return res.status(403).json({ message: 'Seul un administrateur du groupe peut ajouter des membres.' });
    }

    const existe = await DMParticipant.findOne({ where: { conversation_id: conversationId, user_id: userId } });
    if (existe) return res.status(409).json({ message: 'Cet utilisateur est déjà dans le groupe.' });

    await DMParticipant.create({ conversation_id: conversationId, user_id: userId, role: 'membre' });
    return res.json({ message: 'Membre ajouté.' });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'ajout du membre.", error: error.message });
  }
};

// DELETE /api/messages/conversations/:id/membres/:userId — quitter ou retirer un membre
exports.retirerMembre = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const targetId = parseInt(req.params.userId);

    if (targetId !== req.user.id) {
      const monRole = await DMParticipant.findOne({ where: { conversation_id: conversationId, user_id: req.user.id } });
      if (!monRole || monRole.role !== 'admin') {
        return res.status(403).json({ message: 'Seul un administrateur du groupe peut retirer un membre.' });
      }
    }

    await DMParticipant.destroy({ where: { conversation_id: conversationId, user_id: targetId } });
    return res.json({ message: 'Membre retiré du groupe.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du retrait.', error: error.message });
  }
};

// GET /api/messages/conversations/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const participation = await DMParticipant.findOne({ where: { conversation_id: conversationId, user_id: req.user.id } });
    if (!participation) return res.status(403).json({ message: 'Vous ne faites pas partie de cette conversation.' });

    const messages = await DMMessage.findAll({
      where: { conversation_id: conversationId },
      include: [{ model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] }],
      order: [['createdAt', 'ASC']],
      limit: 300,
    });

    participation.dernierAccesA = new Date();
    await participation.save();

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des messages.', error: error.message });
  }
};

// POST /api/messages/conversations/:id/messages
exports.envoyerMessage = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { contenu } = req.body;
    if (!contenu || !contenu.trim()) return res.status(400).json({ message: 'Le message ne peut pas être vide.' });

    const participation = await DMParticipant.findOne({ where: { conversation_id: conversationId, user_id: req.user.id } });
    if (!participation) return res.status(403).json({ message: 'Vous ne faites pas partie de cette conversation.' });

    const message = await DMMessage.create({ conversation_id: conversationId, user_id: req.user.id, contenu: contenu.trim() });
    const messageComplet = await DMMessage.findByPk(message.id, {
      include: [{ model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] }],
    });

    emitDMMessage(conversationId, messageComplet);

    return res.status(201).json({ message: messageComplet });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'envoi du message.", error: error.message });
  }
};

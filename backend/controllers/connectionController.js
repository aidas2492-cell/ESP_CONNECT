const { Op } = require('sequelize');
const { Connection, User, Adhesion } = require('../models');
const { creerNotification } = require('../utils/notify');

const formatUser = (u) => u && ({ id: u.id, nom: u.nom, prenom: u.prenom, photo: u.photo, bio: u.bio });

// POST /api/connexions — envoyer une demande de connexion { userId }
exports.envoyerDemande = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Destinataire invalide.' });
    }

    const existante = await Connection.findOne({
      where: {
        [Op.or]: [
          { demandeur_id: req.user.id, destinataire_id: userId },
          { demandeur_id: userId, destinataire_id: req.user.id },
        ],
      },
    });
    if (existante) {
      return res.status(409).json({ message: 'Une connexion existe déjà ou est en attente avec cette personne.' });
    }

    const connexion = await Connection.create({ demandeur_id: req.user.id, destinataire_id: userId });

    await creerNotification({
      userId,
      titre: 'Nouvelle demande de connexion',
      message: `${req.user.prenom} ${req.user.nom} souhaite se connecter avec vous.`,
      categorie: 'invitation',
      lien: '/reseau',
    });

    return res.status(201).json({ message: 'Demande de connexion envoyée.', connexion });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de l’envoi de la demande.', error: error.message });
  }
};

// PUT /api/connexions/:id — { decision: 'accepter' | 'refuser' }
exports.traiterDemande = async (req, res) => {
  try {
    const { decision } = req.body;
    const connexion = await Connection.findByPk(req.params.id, {
      include: [{ model: User, as: 'demandeur' }],
    });
    if (!connexion) return res.status(404).json({ message: 'Demande introuvable.' });
    if (connexion.destinataire_id !== req.user.id) {
      return res.status(403).json({ message: 'Cette demande ne vous est pas adressée.' });
    }

    connexion.statut = decision === 'accepter' ? 'acceptee' : 'refusee';
    await connexion.save();

    if (decision === 'accepter') {
      await creerNotification({
        userId: connexion.demandeur_id,
        titre: 'Connexion acceptée',
        message: `${req.user.prenom} ${req.user.nom} a accepté votre demande de connexion.`,
        categorie: 'invitation',
      });
    }

    return res.json({ message: 'Demande traitée.', connexion });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du traitement.', error: error.message });
  }
};

// GET /api/connexions — mes connexions acceptées
exports.mesConnexions = async (req, res) => {
  try {
    const connexions = await Connection.findAll({
      where: {
        statut: 'acceptee',
        [Op.or]: [{ demandeur_id: req.user.id }, { destinataire_id: req.user.id }],
      },
      include: [
        { model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom', 'photo', 'bio'] },
        { model: User, as: 'destinataire', attributes: ['id', 'nom', 'prenom', 'photo', 'bio'] },
      ],
    });

    const contacts = connexions.map((c) =>
      c.demandeur_id === req.user.id ? formatUser(c.destinataire) : formatUser(c.demandeur)
    );

    return res.json({ connexions: contacts });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des connexions.', error: error.message });
  }
};

// GET /api/connexions/demandes — demandes reçues en attente
exports.demandesRecues = async (req, res) => {
  try {
    const demandes = await Connection.findAll({
      where: { destinataire_id: req.user.id, statut: 'en_attente' },
      include: [{ model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom', 'photo', 'bio'] }],
    });
    return res.json({ demandes });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des demandes.', error: error.message });
  }
};

// GET /api/connexions/suggestions — membres partageant une structure commune, non encore connectés
exports.suggestions = async (req, res) => {
  try {
    const mesStructureIds = (
      await Adhesion.findAll({ where: { user_id: req.user.id, statut: 'active' }, attributes: ['structure_id'] })
    ).map((a) => a.structure_id);

    const membresDesMemesStructures = await Adhesion.findAll({
      where: { structure_id: { [Op.in]: mesStructureIds }, statut: 'active', user_id: { [Op.ne]: req.user.id } },
      include: [{ model: User, as: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'photo', 'bio'] }],
    });

    const connexionsExistantes = await Connection.findAll({
      where: { [Op.or]: [{ demandeur_id: req.user.id }, { destinataire_id: req.user.id }] },
    });
    const idsExclus = new Set(
      connexionsExistantes.flatMap((c) => [c.demandeur_id, c.destinataire_id])
    );

    const suggestionsMap = new Map();
    membresDesMemesStructures.forEach((a) => {
      if (!idsExclus.has(a.user_id) && !suggestionsMap.has(a.user_id)) {
        suggestionsMap.set(a.user_id, formatUser(a.utilisateur));
      }
    });

    return res.json({ suggestions: Array.from(suggestionsMap.values()).slice(0, 8) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du calcul des suggestions.', error: error.message });
  }
};

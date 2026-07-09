const { Evenement, Structure, Adhesion, User } = require('../models');
const { creerNotification } = require('../utils/notify');
const { estPresidentDe } = require('../utils/authorization');
const { Op } = require('sequelize');

// GET /api/events — liste publique des événements, avec filtres date/structure
exports.getAllEvents = async (req, res) => {
  try {
    const { structureId, a_venir } = req.query;
    const where = {};
    if (structureId) where.structure_id = structureId;
    if (a_venir === 'true') where.date_debut = { [Op.gte]: new Date() };

    const evenements = await Evenement.findAll({
      where,
      include: [{ model: Structure, as: 'structure', attributes: ['id', 'nom', 'logo'] }],
      order: [['date_debut', 'ASC']],
    });

    return res.json({ evenements });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des événements.', error: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const evenement = await Evenement.findByPk(req.params.id, {
      include: [{ model: Structure, as: 'structure' }],
    });
    if (!evenement) return res.status(404).json({ message: 'Événement introuvable.' });
    return res.json({ evenement });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la récupération de l'événement.", error: error.message });
  }
};

// POST /api/events — cas d'utilisation "Publier un événement" (le Président)
exports.createEvent = async (req, res) => {
  try {
    const { structure_id, titre, description, date_debut, date_fin, lieu } = req.body;

    // Scénario alternatif A0 : champs obligatoires manquants ou date passée
    if (!titre || !description || !date_debut || !lieu) {
      return res.status(400).json({ message: 'Champs obligatoires manquants (titre, description, date, lieu).' });
    }
    if (new Date(date_debut) < new Date()) {
      return res.status(400).json({ message: "La date de l'événement ne peut pas être dans le passé." });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const evenement = await Evenement.create({
      structure_id,
      titre,
      description,
      date_debut,
      date_fin: date_fin || null,
      lieu,
      image,
    });

    const structure = await Structure.findByPk(structure_id);
    const membres = await Adhesion.findAll({ where: { structure_id, statut: 'active' } });

    await Promise.all(
      membres.map((m) =>
        creerNotification({
          userId: m.user_id,
          titre: 'Nouvel événement',
          message: `"${structure.nom}" organise : ${titre} le ${new Date(date_debut).toLocaleDateString('fr-FR')}.`,
          lien: `/evenements/${evenement.id}`,
        })
      )
    );

    return res.status(201).json({ message: 'Événement publié avec succès.', evenement });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la publication de l'événement.", error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const evenement = await Evenement.findByPk(req.params.id);
    if (!evenement) return res.status(404).json({ message: 'Événement introuvable.' });

    if (!(await estPresidentDe(req.user, evenement.structure_id))) {
      return res.status(403).json({ message: "Accès réservé au président de cette structure." });
    }

    const { titre, description, date_debut, date_fin, lieu } = req.body;
    if (date_debut && new Date(date_debut) < new Date()) {
      return res.status(400).json({ message: "La date de l'événement ne peut pas être dans le passé." });
    }

    if (req.file) evenement.image = `/uploads/${req.file.filename}`;
    Object.assign(evenement, {
      titre: titre ?? evenement.titre,
      description: description ?? evenement.description,
      date_debut: date_debut ?? evenement.date_debut,
      date_fin: date_fin ?? evenement.date_fin,
      lieu: lieu ?? evenement.lieu,
    });

    await evenement.save();
    return res.json({ message: 'Événement mis à jour.', evenement });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const evenement = await Evenement.findByPk(req.params.id);
    if (!evenement) return res.status(404).json({ message: 'Événement introuvable.' });
    if (!(await estPresidentDe(req.user, evenement.structure_id))) {
      return res.status(403).json({ message: "Accès réservé au président de cette structure." });
    }
    await evenement.destroy();
    return res.json({ message: 'Événement supprimé.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
  }
};

// POST /api/events/:id/participer — un Membre confirme sa participation
exports.participerEvenement = async (req, res) => {
  try {
    const evenement = await Evenement.findByPk(req.params.id, { include: [{ model: Structure, as: 'structure' }] });
    if (!evenement) return res.status(404).json({ message: 'Événement introuvable.' });

    const adhesion = await Adhesion.findOne({
      where: { user_id: req.user.id, structure_id: evenement.structure_id, statut: 'active' },
    });
    if (!adhesion) {
      return res.status(403).json({ message: 'Vous devez être membre de cette structure pour participer.' });
    }

    return res.json({ message: `Participation confirmée pour "${evenement.titre}".` });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la confirmation de participation.', error: error.message });
  }
};

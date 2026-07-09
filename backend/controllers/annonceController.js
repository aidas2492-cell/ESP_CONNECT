const { Annonce, Structure, Adhesion } = require('../models');
const { creerNotification } = require('../utils/notify');
const { estPresidentDe } = require('../utils/authorization');

// GET /api/annonces?structureId=
exports.getAnnonces = async (req, res) => {
  try {
    const where = {};
    if (req.query.structureId) where.structure_id = req.query.structureId;

    const annonces = await Annonce.findAll({
      where,
      include: [{ model: Structure, as: 'structure', attributes: ['id', 'nom', 'logo'] }],
      order: [['date_publication', 'DESC']],
    });
    return res.json({ annonces });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des annonces.', error: error.message });
  }
};

// POST /api/annonces — le président publie une annonce (avec échéance optionnelle pour un compte à rebours)
exports.createAnnonce = async (req, res) => {
  try {
    const { structure_id, titre, contenu, date_echeance } = req.body;
    const annonce = await Annonce.create({
      structure_id,
      titre,
      contenu,
      date_echeance: date_echeance || null,
    });

    const structure = await Structure.findByPk(structure_id);
    const membres = await Adhesion.findAll({ where: { structure_id, statut: 'active' } });
    await Promise.all(
      membres.map((m) =>
        creerNotification({
          userId: m.user_id,
          titre: `Annonce de ${structure.nom}`,
          message: titre,
        })
      )
    );

    return res.status(201).json({ message: 'Annonce publiée.', annonce });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la publication de l'annonce.", error: error.message });
  }
};

exports.updateAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findByPk(req.params.id);
    if (!annonce) return res.status(404).json({ message: 'Annonce introuvable.' });
    if (!(await estPresidentDe(req.user, annonce.structure_id))) {
      return res.status(403).json({ message: "Accès réservé au président de cette structure." });
    }

    const { titre, contenu, date_echeance } = req.body;
    Object.assign(annonce, {
      titre: titre ?? annonce.titre,
      contenu: contenu ?? annonce.contenu,
      date_echeance: date_echeance ?? annonce.date_echeance,
    });
    await annonce.save();
    return res.json({ message: 'Annonce mise à jour.', annonce });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

exports.deleteAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findByPk(req.params.id);
    if (!annonce) return res.status(404).json({ message: 'Annonce introuvable.' });
    if (!(await estPresidentDe(req.user, annonce.structure_id))) {
      return res.status(403).json({ message: "Accès réservé au président de cette structure." });
    }
    await annonce.destroy();
    return res.json({ message: 'Annonce supprimée.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
  }
};

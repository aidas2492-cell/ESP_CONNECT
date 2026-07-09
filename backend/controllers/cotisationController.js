const { Cotisation, Structure, Adhesion, User } = require('../models');
const { creerNotification } = require('../utils/notify');
const { logActivite } = require('../utils/activityLog');

// GET /api/cotisations — un membre voit ses cotisations, un président voit celles de sa structure
exports.getCotisations = async (req, res) => {
  try {
    const where = {};
    if (req.query.structureId) where.structure_id = req.query.structureId;
    if (req.query.mine === 'true') where.user_id = req.user.id;

    const cotisations = await Cotisation.findAll({
      where,
      include: [
        { model: Structure, as: 'structure', attributes: ['id', 'nom'] },
        { model: User, as: 'membre', attributes: ['id', 'nom', 'prenom', 'email'] },
      ],
      order: [['date_echeance', 'DESC']],
    });

    return res.json({ cotisations });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des cotisations.', error: error.message });
  }
};

// POST /api/cotisations — le président définit le montant/échéance pour un ou tous les membres
exports.createCotisation = async (req, res) => {
  try {
    const { structure_id, montant, date_echeance, user_id, pour_tous_les_membres } = req.body;

    if (pour_tous_les_membres) {
      const membres = await Adhesion.findAll({ where: { structure_id, statut: 'active', role_structure: 'membre' } });
      const cotisations = await Promise.all(
        membres.map((m) =>
          Cotisation.create({ structure_id, montant, date_echeance, user_id: m.user_id })
        )
      );
      await Promise.all(
        membres.map((m) =>
          creerNotification({
            userId: m.user_id,
            titre: 'Nouvelle cotisation',
            message: `Une cotisation de ${montant} FCFA est à régler avant le ${new Date(date_echeance).toLocaleDateString('fr-FR')}.`,
          })
        )
      );
      return res.status(201).json({ message: `${cotisations.length} cotisation(s) créée(s).`, cotisations });
    }

    const cotisation = await Cotisation.create({ structure_id, montant, date_echeance, user_id });
    await creerNotification({
      userId: user_id,
      titre: 'Nouvelle cotisation',
      message: `Une cotisation de ${montant} FCFA est à régler avant le ${new Date(date_echeance).toLocaleDateString('fr-FR')}.`,
    });

    return res.status(201).json({ message: 'Cotisation créée.', cotisation });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la création de la cotisation.', error: error.message });
  }
};

// PUT /api/cotisations/:id/payer — cas d'utilisation "Payer une cotisation"
exports.payerCotisation = async (req, res) => {
  try {
    const { mode_paiement } = req.body;
    const cotisation = await Cotisation.findByPk(req.params.id);

    if (!cotisation) return res.status(404).json({ message: 'Cotisation introuvable.' });
    if (cotisation.user_id !== req.user.id) {
      return res.status(403).json({ message: "Vous ne pouvez régler que vos propres cotisations." });
    }
    if (cotisation.statut === 'payee') {
      return res.status(409).json({ message: 'Cette cotisation est déjà réglée.' });
    }

    cotisation.statut = 'payee';
    cotisation.mode_paiement = mode_paiement || 'especes';
    cotisation.date_paiement = new Date();
    await cotisation.save();

    await logActivite({
      userId: req.user.id,
      action: 'Paiement de cotisation',
      details: `${req.user.prenom} ${req.user.nom} a réglé une cotisation de ${cotisation.montant} FCFA`,
    });

    return res.json({ message: 'Paiement enregistré avec succès.', cotisation });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du paiement.', error: error.message });
  }
};

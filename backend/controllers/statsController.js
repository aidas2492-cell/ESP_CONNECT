const { User, Structure, Evenement, Cotisation, Adhesion, ActivityLog } = require('../models');
const { Op } = require('sequelize');

// GET /api/stats/admin — tableau de bord Administrateur
exports.getAdminStats = async (req, res) => {
  try {
    const [totalUtilisateurs, totalStructures, totalEvenements, totalCotisations, revenusTotal] = await Promise.all([
      User.count(),
      Structure.count(),
      Evenement.count(),
      Cotisation.count(),
      Cotisation.sum('montant', { where: { statut: 'payee' } }),
    ]);

    return res.json({
      totalUtilisateurs,
      totalStructures,
      totalEvenements,
      totalCotisations,
      revenusTotal: revenusTotal || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du calcul des statistiques.', error: error.message });
  }
};

// GET /api/stats/journal — journal d'activités (admin)
exports.getActivityLog = async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [{ model: User, as: 'utilisateur', attributes: ['id', 'nom', 'prenom'] }],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });
    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération du journal.', error: error.message });
  }
};

// GET /api/stats/president/:structureId — tableau de bord Président
exports.getPresidentStats = async (req, res) => {
  try {
    const structureId = req.params.structureId;

    const [nombreMembres, nombreEvenements, demandesEnAttente, revenus] = await Promise.all([
      Adhesion.count({ where: { structure_id: structureId, statut: 'active', role_structure: 'membre' } }),
      Evenement.count({ where: { structure_id: structureId } }),
      Adhesion.count({ where: { structure_id: structureId, statut: 'en_attente' } }),
      Cotisation.sum('montant', { where: { structure_id: structureId, statut: 'payee' } }),
    ]);

    const prochainsEvenements = await Evenement.count({
      where: { structure_id: structureId, date_debut: { [Op.gte]: new Date() } },
    });

    return res.json({
      nombreMembres,
      nombreEvenements,
      prochainsEvenements,
      demandesEnAttente,
      revenus: revenus || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du calcul des statistiques.', error: error.message });
  }
};

// GET /api/stats/membre — tableau de bord Membre
exports.getMemberStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [structuresRejointes, cotisationsPayees, cotisationsEnAttente] = await Promise.all([
      Adhesion.count({ where: { user_id: userId, statut: 'active' } }),
      Cotisation.count({ where: { user_id: userId, statut: 'payee' } }),
      Cotisation.count({ where: { user_id: userId, statut: { [Op.in]: ['en_attente', 'en_retard'] } } }),
    ]);

    const mesStructureIds = (
      await Adhesion.findAll({ where: { user_id: userId, statut: 'active' }, attributes: ['structure_id'] })
    ).map((a) => a.structure_id);

    const evenementsAVenir = await Evenement.count({
      where: { structure_id: { [Op.in]: mesStructureIds }, date_debut: { [Op.gte]: new Date() } },
    });

    return res.json({
      structuresRejointes,
      cotisationsPayees,
      cotisationsEnAttente,
      evenementsAVenir,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du calcul des statistiques.', error: error.message });
  }
};

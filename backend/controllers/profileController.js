const { User, Adhesion, Structure, Connection } = require('../models');
const { Op } = require('sequelize');

const champsPublics = ['id', 'nom', 'prenom', 'email', 'photo', 'photo_couverture', 'bio', 'a_propos', 'competences', 'promotion', 'role', 'date_inscription'];

// GET /api/profil/:id — profil public d'un utilisateur (structures, statut de connexion)
exports.getProfil = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: champsPublics });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const adhesions = await Adhesion.findAll({
      where: { user_id: user.id, statut: 'active' },
      include: [{ model: Structure, as: 'structure', attributes: ['id', 'nom', 'logo', 'type'] }],
    });

    const estPresident = adhesions.some((a) => a.role_structure === 'president');

    let statutConnexion = 'aucune';
    let connexionId = null;
    if (req.user && req.user.id !== user.id) {
      const connexion = await Connection.findOne({
        where: {
          [Op.or]: [
            { demandeur_id: req.user.id, destinataire_id: user.id },
            { demandeur_id: user.id, destinataire_id: req.user.id },
          ],
        },
      });
      if (connexion) {
        connexionId = connexion.id;
        if (connexion.statut === 'acceptee') statutConnexion = 'connecte';
        else if (connexion.demandeur_id === req.user.id) statutConnexion = 'demande_envoyee';
        else statutConnexion = 'demande_recue';
      }
    }

    const nombreConnexions = await Connection.count({
      where: { statut: 'acceptee', [Op.or]: [{ demandeur_id: user.id }, { destinataire_id: user.id }] },
    });

    return res.json({
      user: { ...user.toJSON(), verifie: user.role === 'admin' || estPresident },
      structures: adhesions.map((a) => ({ ...a.structure.toJSON(), role_structure: a.role_structure })),
      statutConnexion,
      connexionId,
      nombreConnexions,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération du profil.', error: error.message });
  }
};

// PUT /api/profil — mise à jour de son propre profil étendu
exports.updateProfil = async (req, res) => {
  try {
    const { bio, a_propos, competences, promotion, nom, prenom, telephone } = req.body;

    const donnees = {};
    if (nom) donnees.nom = nom;
    if (prenom) donnees.prenom = prenom;
    if (telephone !== undefined) donnees.telephone = telephone;
    if (bio !== undefined) donnees.bio = bio;
    if (a_propos !== undefined) donnees.a_propos = a_propos;
    if (promotion !== undefined) donnees.promotion = promotion;
    if (competences !== undefined) {
      donnees.competences = typeof competences === 'string' ? JSON.parse(competences) : competences;
    }
    if (req.files?.photo) donnees.photo = `/uploads/${req.files.photo[0].filename}`;
    if (req.files?.couverture) donnees.photo_couverture = `/uploads/${req.files.couverture[0].filename}`;

    await req.user.update(donnees);

    const { password, ...safeUser } = req.user.toJSON();
    return res.json({ message: 'Profil mis à jour.', user: safeUser });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.', error: error.message });
  }
};

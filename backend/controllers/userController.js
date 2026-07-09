const bcrypt = require('bcrypt');
const { User, Adhesion, Structure } = require('../models');
const { logActivite } = require('../utils/activityLog');

// GET /api/users — l'administrateur consulte tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['date_inscription', 'DESC']],
    });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.', error: error.message });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Adhesion, as: 'adhesions', include: [{ model: Structure, as: 'structure' }] }],
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur.", error: error.message });
  }
};

// PUT /api/users/:id — modifier le profil ou le rôle (admin)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const { nom, prenom, telephone, role, password } = req.body;

    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
    if (role && req.user.role === 'admin') user.role = role;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    await logActivite({ userId: req.user.id, action: 'Modification utilisateur', details: `Utilisateur #${user.id} modifié` });

    const { password: _pw, ...safeUser } = user.toJSON();
    return res.json({ message: 'Utilisateur mis à jour.', user: safeUser });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

// PUT /api/users/:id/desactiver — l'admin désactive/réactive un compte
exports.toggleActivation = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    user.actif = !user.actif;
    await user.save();

    await logActivite({
      userId: req.user.id,
      action: user.actif ? 'Réactivation de compte' : 'Désactivation de compte',
      details: `Compte de ${user.prenom} ${user.nom} ${user.actif ? 'réactivé' : 'désactivé'}`,
    });

    return res.json({ message: `Compte ${user.actif ? 'réactivé' : 'désactivé'} avec succès.`, user });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du changement de statut.', error: error.message });
  }
};

// DELETE /api/users/:id — l'admin supprime un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    await user.destroy();
    await logActivite({ userId: req.user.id, action: 'Suppression utilisateur', details: `Utilisateur #${req.params.id} supprimé` });

    return res.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
  }
};

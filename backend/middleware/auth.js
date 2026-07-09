const jwt = require('jsonwebtoken');
const { User, Adhesion } = require('../models');

// Vérifie la présence et la validité du token JWT (cas d'utilisation "S'authentifier").
// Toute route protégée passe par ce middleware avant d'exécuter sa logique métier.
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès refusé. Veuillez vous authentifier.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable. Session invalide.' });
    }

    if (!user.actif) {
      return res.status(403).json({ message: 'Ce compte a été désactivé. Contactez un administrateur.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

// Réserve une route aux administrateurs.
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Accès réservé à l'administrateur." });
  }
  next();
};

// Réserve une route au président de la structure ciblée par req.params.structureId,
// ou à l'administrateur. Vérifie via la table Adhesion que l'utilisateur a bien
// le rôle "president" et une adhésion active sur cette structure précise.
exports.isPresident = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    const structureId = req.params.structureId || req.params.id || req.body.structure_id;

    const adhesion = await Adhesion.findOne({
      where: {
        user_id: req.user.id,
        structure_id: structureId,
        role_structure: 'president',
        statut: 'active',
      },
    });

    if (!adhesion) {
      return res.status(403).json({
        message: "Accès réservé au président de cette structure.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur de vérification des droits.', error: error.message });
  }
};

const { Adhesion } = require('../models');

// Vérifie que l'utilisateur est président actif de la structure donnée, ou administrateur.
exports.estPresidentDe = async (user, structureId) => {
  if (user.role === 'admin') return true;
  const adhesion = await Adhesion.findOne({
    where: { user_id: user.id, structure_id: structureId, role_structure: 'president', statut: 'active' },
  });
  return !!adhesion;
};

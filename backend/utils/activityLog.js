const { ActivityLog } = require('../models');

exports.logActivite = async ({ userId, action, details = null }) => {
  try {
    await ActivityLog.create({ user_id: userId, action, details });
  } catch (error) {
    console.error("Erreur d'écriture du journal d'activités:", error.message);
  }
};

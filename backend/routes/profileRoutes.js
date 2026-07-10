const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Optionnel : enrichit req.user si connecté, sans bloquer les visiteurs
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  return authenticate(req, res, next);
};

router.get('/:id', optionalAuth, profileController.getProfil);
router.put(
  '/',
  authenticate,
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'couverture', maxCount: 1 }]),
  profileController.updateProfil
);

module.exports = router;

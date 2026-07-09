const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post(
  '/register',
  [
    body('nom').notEmpty().withMessage('Le nom est requis.'),
    body('prenom').notEmpty().withMessage('Le prénom est requis.'),
    body('email').isEmail().withMessage('Email invalide.'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
  ],
  authController.register
);

router.post(
  '/login',
  [body('email').isEmail().withMessage('Email invalide.'), body('password').notEmpty()],
  authController.login
);

router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, authController.updateProfile);

module.exports = router;

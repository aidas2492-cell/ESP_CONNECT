const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../models');

// Domaines autorisés à l'inscription (étudiants/personnel de l'ESP uniquement).
// Configurable via .env, ex: ALLOWED_EMAIL_DOMAINS=esp.sn,etu.esp.sn
// Laissez vide dans .env pour désactiver la restriction (utile en dev/démo).
const domainesAutorises = (process.env.ALLOWED_EMAIL_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const emailAutorise = (email) => {
  if (domainesAutorises.length === 0) return true; // restriction désactivée
  const domaine = email.split('@')[1]?.toLowerCase();
  return domainesAutorises.includes(domaine);
};

const genererToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const formatUser = (user) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  telephone: user.telephone,
  photo: user.photo,
  role: user.role,
  date_inscription: user.date_inscription,
});

// POST /api/auth/register  — le Visiteur s'inscrit et devient Membre
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Données invalides', errors: errors.array() });
  }

  try {
    const { nom, prenom, email, password, telephone } = req.body;

    if (!emailAutorise(email)) {
      return res.status(403).json({
        message: `L'inscription est réservée aux adresses email de l'ESP (${domainesAutorises.map((d) => '@' + d).join(', ')}).`,
      });
    }

    const existant = await User.findOne({ where: { email } });
    if (existant) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nom,
      prenom,
      email,
      telephone,
      password: hashedPassword,
    });

    const token = genererToken(user);
    return res.status(201).json({ message: 'Compte créé avec succès.', token, user: formatUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'inscription.", error: error.message });
  }
};

// POST /api/auth/login — cas d'utilisation "S'authentifier"
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Données invalides', errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const motDePasseValide = await bcrypt.compare(password, user.password);
    if (!motDePasseValide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = genererToken(user);
    return res.json({ message: 'Connexion réussie.', token, user: formatUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la connexion.', error: error.message });
  }
};

// GET /api/auth/me — récupère le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  return res.json({ user: formatUser(req.user) });
};

// PUT /api/auth/me — mise à jour du profil
exports.updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;
    await req.user.update({ nom, prenom, telephone });
    return res.json({ message: 'Profil mis à jour.', user: formatUser(req.user) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

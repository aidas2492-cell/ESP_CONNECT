const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Authentification optionnelle : enrichit req.user si un token est fourni,
// mais laisse les visiteurs consulter le fil en lecture seule.
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  return authenticate(req, res, next);
};

router.get('/', optionalAuth, feedController.getFeed);
router.post('/', authenticate, upload.single('image'), feedController.createPost);
router.delete('/:id', authenticate, feedController.deletePost);

router.post('/:id/like', authenticate, feedController.toggleLike);
router.get('/:id/comments', feedController.getComments);
router.post('/:id/comments', authenticate, feedController.addComment);

router.get('/meta/tendances', feedController.getTendances);
router.get('/meta/membres-en-vue', feedController.getMembresEnVue);
router.get('/meta/galerie', feedController.getGalerie);

module.exports = router;

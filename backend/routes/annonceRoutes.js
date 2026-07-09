const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceController');
const { authenticate, isPresident } = require('../middleware/auth');

router.get('/', annonceController.getAnnonces);
router.post('/', authenticate, isPresident, annonceController.createAnnonce);
router.put('/:id', authenticate, annonceController.updateAnnonce);
router.delete('/:id', authenticate, annonceController.deleteAnnonce);

module.exports = router;

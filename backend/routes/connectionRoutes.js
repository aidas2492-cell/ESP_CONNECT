const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, connectionController.mesConnexions);
router.get('/demandes', authenticate, connectionController.demandesRecues);
router.get('/suggestions', authenticate, connectionController.suggestions);
router.post('/', authenticate, connectionController.envoyerDemande);
router.put('/:id', authenticate, connectionController.traiterDemande);

module.exports = router;

const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dmController');
const { authenticate } = require('../middleware/auth');

router.get('/utilisateurs', authenticate, dmController.rechercherUtilisateurs);
router.get('/conversations', authenticate, dmController.getMesConversations);
router.post('/conversations/direct', authenticate, dmController.creerOuRecupererDirect);
router.post('/conversations/group', authenticate, dmController.creerGroupe);
router.post('/conversations/:id/membres', authenticate, dmController.ajouterMembre);
router.delete('/conversations/:id/membres/:userId', authenticate, dmController.retirerMembre);
router.get('/conversations/:id/messages', authenticate, dmController.getMessages);
router.post('/conversations/:id/messages', authenticate, dmController.envoyerMessage);

module.exports = router;

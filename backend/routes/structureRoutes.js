const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structureController');
const messageController = require('../controllers/messageController');
const { authenticate, isPresident, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  return authenticate(req, res, next);
};

router.get('/', structureController.getAllStructures);
router.get('/mes-structures', authenticate, structureController.mesStructures);
router.get('/peut-creer', authenticate, structureController.peutCreerStructure);
router.get('/demandes-presidence', authenticate, isAdmin, structureController.demandesPresidenceEnAttente);
router.get('/:id', optionalAuth, structureController.getStructureById);
router.post('/', authenticate, upload.single('logo'), structureController.createStructure);
router.put('/:id', authenticate, isPresident, upload.single('logo'), structureController.updateStructure);
router.put('/:id/organe-central', authenticate, isAdmin, structureController.definirOrganeCentral);
router.delete('/:id', authenticate, isPresident, structureController.deleteStructure);

router.post('/:id/adhesions', authenticate, structureController.demanderAdhesion);
router.get('/:id/demandes', authenticate, isPresident, structureController.getDemandesEnAttente);
router.put('/:id/membres/:userId/retirer', authenticate, isPresident, structureController.retirerMembre);
router.put('/:id/quitter', authenticate, structureController.quitterStructure);
router.post('/:id/informer', authenticate, isPresident, structureController.informerMembres);

router.get('/:id/messages', authenticate, messageController.getMessages);
router.post('/:id/messages', authenticate, messageController.postMessage);

module.exports = router;

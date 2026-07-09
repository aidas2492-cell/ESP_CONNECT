const express = require('express');
const router = express.Router();
const evenementController = require('../controllers/evenementController');
const { authenticate, isPresident } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', evenementController.getAllEvents);
router.get('/:id', evenementController.getEventById);
router.post('/', authenticate, isPresident, upload.single('image'), evenementController.createEvent);
router.put('/:id', authenticate, upload.single('image'), evenementController.updateEvent);
router.delete('/:id', authenticate, evenementController.deleteEvent);
router.post('/:id/participer', authenticate, evenementController.participerEvenement);

module.exports = router;

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, notificationController.getMyNotifications);
router.put('/tout-lire', authenticate, notificationController.toutMarquerCommeLu);
router.put('/:id/lue', authenticate, notificationController.marquerCommeLue);

module.exports = router;

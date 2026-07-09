const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate, isAdmin, isPresident } = require('../middleware/auth');

router.get('/admin', authenticate, isAdmin, statsController.getAdminStats);
router.get('/journal', authenticate, isAdmin, statsController.getActivityLog);
router.get('/president/:structureId', authenticate, isPresident, statsController.getPresidentStats);
router.get('/membre', authenticate, statsController.getMemberStats);

module.exports = router;

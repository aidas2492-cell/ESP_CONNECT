const express = require('express');
const router = express.Router();
const cotisationController = require('../controllers/cotisationController');
const { authenticate, isPresident } = require('../middleware/auth');

router.get('/', authenticate, cotisationController.getCotisations);
router.post('/', authenticate, isPresident, cotisationController.createCotisation);
router.put('/:id/payer', authenticate, cotisationController.payerCotisation);

module.exports = router;

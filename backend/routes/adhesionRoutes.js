const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structureController');
const { authenticate } = require('../middleware/auth');

router.put('/:id', authenticate, structureController.traiterAdhesion);

module.exports = router;

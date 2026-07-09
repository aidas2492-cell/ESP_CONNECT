const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', authenticate, isAdmin, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.put('/:id/desactiver', authenticate, isAdmin, userController.toggleActivation);
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

module.exports = router;

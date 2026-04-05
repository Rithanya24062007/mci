const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /login - User login
router.post('/login', authController.login);

// POST /auth/login - Compatibility alias for older clients/docs
router.post('/auth/login', authController.login);

module.exports = router;

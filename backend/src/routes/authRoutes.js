const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');
const validateRegistration = require('../middleware/validateRegistration');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRegistration, register);

module.exports = router;

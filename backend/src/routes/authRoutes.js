const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const validateRegistration = require('../middleware/validateRegistration');
const validateLogin = require('../middleware/validateLogin');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRegistration, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, login);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, logout, deleteAccount } = require('../controllers/authController');
const validateRegistration = require('../middleware/validateRegistration');
const validateLogin = require('../middleware/validateLogin');
const authenticateToken = require('../middleware/authenticateToken');

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

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (authenticated user)
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   DELETE /api/auth/account/:userId
 * @desc    Delete user account
 * @access  Private (authenticated user)
 */
router.delete('/account/:userId', authenticateToken, deleteAccount);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, logout, deleteAccount, registerSubUser, getSubUsers, removeSubUser } = require('../controllers/authController');
const validateRegistration = require('../middleware/validateRegistration');
const validateLogin = require('../middleware/validateLogin');
const validateSubUserRegistration = require('../middleware/validateSubUserRegistration');
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

/**
 * @route   POST /api/auth/sub-user/:parentUserId
 * @desc    Register a sub-user linked to a parent account
 * @access  Public (with invitation) or Private (parent user authenticated)
 */
router.post('/sub-user/:parentUserId', validateSubUserRegistration, registerSubUser);

/**
 * @route   GET /api/auth/sub-users
 * @desc    Get all sub-users for the authenticated user's account
 * @access  Private (authenticated user)
 */
router.get('/sub-users', authenticateToken, getSubUsers);

/**
 * @route   DELETE /api/auth/sub-user/:subUserId
 * @desc    Remove a sub-user account
 * @access  Private (sub-user themselves, parent account owner, or admin)
 */
router.delete('/sub-user/:subUserId', authenticateToken, removeSubUser);

module.exports = router;

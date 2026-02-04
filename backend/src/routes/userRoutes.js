const express = require('express');
const router = express.Router();
const { register, login, logout, deleteAccount, updateEmail, updatePassword, getSubUsers, removeSubUser, updateSubUserRole } = require('../controllers/authController');
const validateRegistration = require('../middleware/validateRegistration');
const validateLogin = require('../middleware/validateLogin');
const validateSubUserRoleUpdate = require('../middleware/validateSubUserRoleUpdate');
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
 * @route   PUT /api/auth/email
 * @desc    Update user's email address
 * @access  Private (authenticated user - self only)
 */
router.put('/email', authenticateToken, updateEmail);

/**
 * @route   PUT /api/auth/password
 * @desc    Update user's password
 * @access  Private (authenticated user - self only)
 */
router.put('/password', authenticateToken, updatePassword);

/**
 * @route   DELETE /api/auth/account/:userId
 * @desc    Delete user account
 * @access  Private (authenticated user)
 */
router.delete('/account/:userId', authenticateToken, deleteAccount);

/**
 * @route   GET /api/auth/sub-users
 * @desc    Get all sub-users for the authenticated user's account
 * @access  Private (authenticated user)
 */
router.get('/sub-users', authenticateToken, getSubUsers);

/**
 * @route   DELETE /api/auth/sub-user/:subUserId
 * @desc    Remove a sub-user linking (unlinks sub-user from parent, keeps the user account)
 * @access  Private (sub-user themselves, parent account owner, or admin)
 */
router.delete('/sub-user/:subUserId', authenticateToken, removeSubUser);

/**
 * @route   PUT /api/auth/sub-user/:subUserId/role
 * @desc    Update the role of a sub-user
 * @access  Private (parent account owner only)
 */
router.put('/sub-user/:subUserId/role', authenticateToken, validateSubUserRoleUpdate, updateSubUserRole);

module.exports = router;

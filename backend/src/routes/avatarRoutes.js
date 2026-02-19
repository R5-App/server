const express = require('express');
const router = express.Router();
const {
    uploadAvatar,
    getAvatarById,
    downloadAvatar,
    deleteAvatar,
    getAvatarByPet,
    getAvatarByUser
} = require('../controllers/avatarController');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadAvatarMiddleware } = require('../middleware/avatarUpload');

/**
 * @route GET /api/avatars/user/current
 * @desc Get current avatar for authenticated user (only one avatar per user)
 * @access Private
 */
router.get('/user/current', authenticateToken, getAvatarByUser);

/**
 * @route GET /api/avatars/pet/:petId
 * @desc Get current avatar for a specific pet (only one avatar per pet)
 * @access Private
 */
router.get('/pet/:petId', authenticateToken, getAvatarByPet);

/**
 * @route GET /api/avatars/:id/download
 * @desc Download/Get avatar file information
 * @access Private
 */
router.get('/:id/download', authenticateToken, downloadAvatar);

/**
 * @route GET /api/avatars/:id
 * @desc Get a specific avatar by ID
 * @access Private
 */
router.get('/:id', authenticateToken, getAvatarById);

/**
 * @route POST /api/avatars
 * @desc Upload a new avatar for a pet or user profile (replaces existing)
 * @access Private (pet owner only for pet avatars)
 */
router.post('/', authenticateToken, uploadAvatarMiddleware, uploadAvatar);

/**
 * @route DELETE /api/avatars/:id
 * @desc Delete an avatar by ID
 * @access Private (only owner, pet owner for pet avatars)
 */
router.delete('/:id', authenticateToken, deleteAvatar);

module.exports = router;

const Avatar = require('../models/Avatar');
const Pet = require('../models/Pet');
const path = require('path');
const fs = require('fs');

/**
 * Upload a new avatar/image for a pet or user (replaces existing)
 * Only pet owner can upload/edit pet avatars
 * @route POST /api/avatars
 */
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pet_id } = req.body;

        // File from multer middleware
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // If pet_id is provided, verify pet ownership (OWNER ONLY)
        if (pet_id) {
            const petBelongsToUser = await Pet.belongsToUser(pet_id, userId);
            if (!petBelongsToUser) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to add avatar to this pet'
                });
            }

            // Delete existing pet avatar
            await Avatar.deleteByPetId(pet_id);
        } else {
            // If no pet_id, this is a user profile avatar
            // Delete existing user avatar
            await Avatar.deleteByUserId(userId);
        }

        // Create new avatar with safe random filename from multer
        const newAvatar = await Avatar.create({
            user_id: userId,
            pet_id: pet_id || null,
            filename: req.file.filename  // Random name from multer (e.g., a3f9c2e1b4d7...jpg)
        });

        res.status(201).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: newAvatar
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload avatar'
        });
    }
};

/**
 * Get avatar by ID
 * @route GET /api/avatars/:id
 */
const getAvatarById = async (req, res) => {
    try {
        const { id } = req.params;

        const avatar = await Avatar.getById(id);

        if (!avatar) {
            return res.status(404).json({
                success: false,
                message: 'Avatar not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Avatar retrieved successfully',
            data: avatar
        });
    } catch (error) {
        console.error('Get avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve avatar'
        });
    }
};

/**
 * Download/Get avatar file
 * @route GET /api/avatars/:id/download
 */
const downloadAvatar = async (req, res) => {
    try {
        const { id } = req.params;

        const avatar = await Avatar.getById(id);

        if (!avatar) {
            return res.status(404).json({
                success: false,
                message: 'Avatar not found'
            });
        }

        // Build full file path
        const uploadDir = 'uploads/avatars';
        const filepath = path.join(uploadDir, avatar.filename);

        // Check if file exists on disk
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({
                success: false,
                message: 'Image file not found on server'
            });
        }

        // Send file to client
        // sendFile serves inline (displays in browser/app)
        res.sendFile(path.resolve(filepath));
    } catch (error) {
        console.error('Download avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download avatar'
        });
    }
};

/**
 * Delete avatar by ID (only pet owner can delete pet avatars)
 * @route DELETE /api/avatars/:id
 */
const deleteAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Get avatar to check permissions
        const avatar = await Avatar.getById(id);
        if (!avatar) {
            return res.status(404).json({
                success: false,
                message: 'Avatar not found'
            });
        }

        // Check if user owns this avatar
        const belongsToUser = await Avatar.belongsToUser(id, userId);
        if (!belongsToUser) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this avatar'
            });
        }

        // For pet avatars, only pet owner can delete
        if (avatar.pet_id) {
            const petBelongsToUser = await Pet.belongsToUser(avatar.pet_id, userId);
            if (!petBelongsToUser) {
                return res.status(403).json({
                    success: false,
                    message: 'Only pet owner can delete pet avatars'
                });
            }
        }

        const deleted = await Avatar.deleteById(id);
        if (!deleted) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete avatar'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Avatar deleted successfully'
        });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete avatar'
        });
    }
};

/**
 * Get current avatar for a specific pet (only one avatar per pet)
 * @route GET /api/avatars/pet/:petId
 */
const getAvatarByPet = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { petId } = req.params;

        if (!petId) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID required'
            });
        }

        // Verify user has access to pet
        const hasAccess = await Pet.userHasAccess(petId, userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this pet'
            });
        }

        const avatar = await Avatar.getByPetId(petId);

        if (!avatar) {
            return res.status(404).json({
                success: false,
                message: 'No avatar found for this pet'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pet avatar retrieved successfully',
            data: avatar
        });
    } catch (error) {
        console.error('Get pet avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pet avatar'
        });
    }
};

/**
 * Get current avatar for authenticated user (only one avatar per user)
 * @route GET /api/avatars/user/current
 */
const getAvatarByUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        const avatar = await Avatar.getByUserId(userId);

        if (!avatar) {
            return res.status(404).json({
                success: false,
                message: 'No profile avatar found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User avatar retrieved successfully',
            data: avatar
        });
    } catch (error) {
        console.error('Get user avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user avatar'
        });
    }
};

module.exports = {
    uploadAvatar,
    getAvatarById,
    downloadAvatar,
    deleteAvatar,
    getAvatarByPet,
    getAvatarByUser
};

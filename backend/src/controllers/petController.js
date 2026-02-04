const Pet = require ('../models/Pet');
const { generateShareCode, verifyShareCode } = require('../utils/shareCode');

/**
 * Get all pets for the authenticated user
 * @route GET /api/pets
 */
const getUserPets = async (req, res) => {
    try {
        // Use effectiveUserId for sub-user support (set by resolveEffectiveUser middleware)
        const userId = req.effectiveUserId || req.user.userId;

        const pets = await Pet.getAllByOwnerId(userId);

        res.status(200).json({
            success: true,
            message: 'Pets retrieved successfully',
            data: pets,
            count: pets.length
        });
    } catch (error) {
        console.error('Get pets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pets'
        });
    }
};

/** 
 * Create new pet / add a new pet. 
 * @route POST /api/pets
 */

const addPet = async (req, res) => {
    try {
        const userId = req.user.userId; // the user creating the pet
        const { name, type, breed, sex, birthdate, notes } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Pet name required'
            });
        }

        const newPet = await Pet.create({
            owner_id: userId,
            name,
            type,
            breed,
            sex,
            birthdate,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Pet created succesfully',
            data: newPet
        });
    } catch (error) {
        console.error('Add pet error: ', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create pet'
        });
    }
};

/**
 * Get complete pet data with all related information
 * @route GET /api/pets/:petId/complete
 */
const getCompletePetData = async (req, res) => {
    try {
        const userId = req.effectiveUserId || req.user.userId;
        const { petId } = req.params;

        if (!petId) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID required'
            });
        }

        // Verify pet belongs to user
        const belongsToUser = await Pet.belongsToUser(petId, userId);
        if (!belongsToUser) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found or access denied'
            });
        }

        // Get complete pet data
        const completePetData = await Pet.getCompleteDataById(petId);

        if (!completePetData) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Complete pet data retrieved successfully',
            data: completePetData
        });
    } catch (error) {
        console.error('Get complete pet data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve complete pet data'
        });
    }
};

/**
 * Delete pet
 * @route DELETE /api/pets/:petId
 */
const deletePet = async (req, res) => {
    try {
        // IF NEEDED: Use effectiveUserId for sub-user support (set by resolveEffectiveUser middleware)
        // IN WHICH CASE YOU WOULD HAVE:
        // const userId = req.effectiveUserId || req.user.userId; // and other edits might be needed in other files to implement this properly
        // But if ONLY the pet owner can delete the pet, then:
        const userId = req.user.userId;
        const { petId } = req.params;

        if (!petId) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID required'
            });
        }

        // fetch pet
        const pet = await Pet.getById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // check if user owns the pet
        if (pet.owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized. Only pet owner can delete this pet'
            });
        }

        // if user owns the pet, proceed to delete:
        const deletedPet = await Pet.deleteById(petId);
        if (!deletedPet) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete pet'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pet deleted successfully',
            data: pet
        });
    } catch (error) {
        console.error('Delete pet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete pet'
        });
    }
};

/**
 * Generate a temporary share code for a pet
 * @route POST /api/pets/:petId/share
 */
const generatePetShareCode = async (req, res) => {
    try {
        const userId = req.user.userId; // Only owner can generate share codes
        const { petId } = req.params;
        const { expiresIn } = req.body; // Optional: custom expiration time

        if (!petId) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID required'
            });
        }

        // Verify user owns the pet
        const pet = await Pet.getById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        if (pet.owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the pet owner can generate share codes'
            });
        }

        // Generate share code (default: 24 hours)
        const shareCode = generateShareCode(petId, expiresIn || '24h');

        res.status(200).json({
            success: true,
            message: 'Share code generated successfully',
            data: {
                shareCode,
                petId: pet.id,
                petName: pet.name,
                expiresIn: expiresIn || '24h'
            }
        });
    } catch (error) {
        console.error('Generate share code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate share code'
        });
    }
};

/**
 * Redeem a share code to gain access to a pet
 * @route POST /api/pets/redeem
 */
const redeemPetShareCode = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { shareCode } = req.body;

        if (!shareCode) {
            return res.status(400).json({
                success: false,
                message: 'Share code required'
            });
        }

        // Verify and decode share code
        const decoded = verifyShareCode(shareCode);
        if (!decoded) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired share code'
            });
        }

        const petId = decoded.petId;

        // Verify pet exists
        const pet = await Pet.getById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Check if user is already the owner
        if (pet.owner_id === userId) {
            return res.status(400).json({
                success: false,
                message: 'You already own this pet'
            });
        }

        // Check if user already has access
        const hasAccess = await Pet.userHasAccess(petId, userId);
        if (hasAccess) {
            return res.status(400).json({
                success: false,
                message: 'You already have access to this pet'
            });
        }

        // Add user to pet_users table with owner_id and default role 'hoitaja'
        const sharedUser = await Pet.addSharedUser(petId, userId, pet.owner_id, 'hoitaja');
        
        if (!sharedUser) {
            return res.status(409).json({
                success: false,
                message: 'Failed to add pet access - user may already have access'
            });
        }

        // Get complete pet data to return
        const completePetData = await Pet.getCompleteDataById(petId);

        res.status(200).json({
            success: true,
            message: 'Pet access granted successfully',
            data: completePetData
        });
    } catch (error) {
        console.error('Redeem share code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to redeem share code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get all users who have access to a pet
 * @route GET /api/pets/:petId/shared-users
 */
const getSharedUsers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { petId } = req.params;

        if (!petId) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID required'
            });
        }

        // Verify user owns the pet
        const pet = await Pet.getById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        if (pet.owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the pet owner can view shared users'
            });
        }

        const sharedUsers = await Pet.getSharedUsers(petId);

        res.status(200).json({
            success: true,
            message: 'Shared users retrieved successfully',
            data: sharedUsers,
            count: sharedUsers.length
        });
    } catch (error) {
        console.error('Get shared users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve shared users'
        });
    }
};

/**
 * Remove a user's access to a pet
 * @route DELETE /api/pets/:petId/shared-users/:sharedUserId
 */
const removeSharedUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { petId, sharedUserId } = req.params;

        if (!petId || !sharedUserId) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID and user ID required'
            });
        }

        // Verify user owns the pet
        const pet = await Pet.getById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        if (pet.owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the pet owner can remove shared access'
            });
        }

        const removed = await Pet.removeSharedUser(petId, sharedUserId);

        if (!removed) {
            return res.status(404).json({
                success: false,
                message: 'Shared user not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Shared user access removed successfully'
        });
    } catch (error) {
        console.error('Remove shared user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove shared user'
        });
    }
};

module.exports = {
    getUserPets,
    addPet,
    deletePet,
    getCompletePetData,
    generatePetShareCode,
    redeemPetShareCode,
    getSharedUsers,
    removeSharedUser
}
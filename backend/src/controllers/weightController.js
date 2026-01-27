const Weight = require('../models/Weight');
const User = require('../models/User');
const pool = require('../config/database');

/**
 * Helper function to check if user has permission to modify pet data
 * @param {string} userId - Current user ID
 * @param {string} petOwnerId - Pet owner ID
 * @returns {Promise<boolean>} true if user has permission
 */
const hasPermissionForPet = async (userId, petOwnerId) => {
    // Direct owner has permission
    if (userId === petOwnerId) {
        return true;
    }

    // Check if user is a sub-user with 'omistaja' role
    const parentUser = await User.getParentUser(userId);
    if (parentUser && parentUser.id === petOwnerId && parentUser.role === 'omistaja') {
        return true;
    }

    return false;
};

/**
 * Get all weight records for the authenticated user's pets
 * @route GET /api/weights
 */
const getUserPetWeights = async (req, res) => {
    try {
        // Use effectiveUserId for sub-user support (set by resolveEffectiveUser middleware)
        const userId = req.effectiveUserId || req.user.userId;

        const weights = await Weight.getAllByUserId(userId);

        // Group weights by pet
        const groupedByPet = weights.reduce((acc, weight) => {
            const petId = weight.pet_id;
            
            if (!acc[petId]) {
                acc[petId] = {
                    pet_id: petId,
                    pet_name: weight.pet_name,
                    pet_type: weight.pet_type,
                    weights: []
                };
            }
            
            // Add weight without pet info (since it's now in the parent object)
            acc[petId].weights.push({
                id: weight.id,
                weight: weight.weight,
                date: weight.date,
                created_at: weight.created_at
            });
            
            return acc;
        }, {});

        // Convert object to array
        const result = Object.values(groupedByPet);

        res.status(200).json({
            success: true,
            message: 'Weight records retrieved successfully',
            data: result,
            total_pets: result.length,
            total_weights: weights.length
        });
    } catch (error) {
        console.error('Get weights error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve weight records'
        });
    }
};

/**
 * Add a new weight record for a pet
 * @route POST /api/weights
 */
const addWeight = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pet_id, weight, date } = req.body;

        if (!pet_id || !weight || !date) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID, weight, and date are required'
            });
        }

        // Get pet to verify ownership
        const petQuery = await pool.query('SELECT owner_id FROM pets WHERE id = $1', [pet_id]);
        if (!petQuery.rows[0]) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        const petOwnerId = petQuery.rows[0].owner_id;
        
        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, petOwnerId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to add weight for this pet'
            });
        }

        const newWeight = await Weight.create({
            pet_id,
            weight,
            date
        });

        res.status(201).json({
            success: true,
            message: 'Weight record created successfully',
            data: newWeight
        });
    } catch (error) {
        console.error('Add weight error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create weight record'
        });
    }
};

/**
 * Update an existing weight record
 * @route PUT /api/weights/:id
 */
const updateWeight = async (req, res) => {
    try {
        const userId = req.user.userId;
        const weightId = req.params.id;
        const { weight, date } = req.body;

        // Get weight record with owner info
        const weightRecord = await Weight.getByIdWithOwner(weightId);
        if (!weightRecord) {
            return res.status(404).json({
                success: false,
                message: 'Weight record not found'
            });
        }

        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, weightRecord.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this weight record'
            });
        }

        // Update weight record
        const updatedWeight = await Weight.update(weightId, {
            weight,
            date
        });

        res.status(200).json({
            success: true,
            message: 'Weight record updated successfully',
            data: updatedWeight
        });
    } catch (error) {
        console.error('Update weight error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update weight record'
        });
    }
};

/**
 * Delete a weight record
 * @route DELETE /api/weights/:id
 */
const deleteWeight = async (req, res) => {
    try {
        const userId = req.user.userId;
        const weightId = req.params.id;

        // Get weight record with owner info
        const weightRecord = await Weight.getByIdWithOwner(weightId);
        if (!weightRecord) {
            return res.status(404).json({
                success: false,
                message: 'Weight record not found'
            });
        }

        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, weightRecord.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this weight record'
            });
        }

        // Delete weight record
        const deleted = await Weight.deleteById(weightId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Weight record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Weight record deleted successfully'
        });
    } catch (error) {
        console.error('Delete weight error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete weight record'
        });
    }
};

module.exports = {
    getUserPetWeights,
    addWeight,
    updateWeight,
    deleteWeight
};

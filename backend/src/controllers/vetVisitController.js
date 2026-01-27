const VetVisit = require('../models/VetVisit');
const Pet = require('../models/Pet');
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
 * Get all vet visits for the authenticated user's pets
 * @route GET /api/vet-visits
 */
const getUserPetVetVisits = async (req, res) => {
    try {
        // Use effectiveUserId for sub-user support (set by resolveEffectiveUser middleware)
        const userId = req.effectiveUserId || req.user.userId;

        const vetVisits = await VetVisit.getAllByUserId(userId);

        // Group vet visits by pet
        const groupedByPet = vetVisits.reduce((acc, visit) => {
            const petId = visit.pet_id;
            
            if (!acc[petId]) {
                acc[petId] = {
                    pet_id: petId,
                    pet_name: visit.pet_name,
                    pet_type: visit.pet_type,
                    vet_visits: []
                };
            }
            
            // Add vet visit without pet info (since it's now in the parent object)
            acc[petId].vet_visits.push({
                id: visit.id,
                vet_name: visit.vet_name,
                location: visit.location,
                type_id: visit.type_id,
                visit_date: visit.visit_date,
                notes: visit.notes,
                costs: visit.costs
            });
            
            return acc;
        }, {});

        // Convert object to array
        const result = Object.values(groupedByPet);

        res.status(200).json({
            success: true,
            message: 'Vet visits retrieved successfully',
            data: result,
            total_pets: result.length,
            total_visits: vetVisits.length
        });
    } catch (error) {
        console.error('Get vet visits error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve vet visits'
        });
    }
};

/**
 * Add a new vet visit record for a pet
 * @route POST /api/vet-visits
 */
const addVetVisit = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pet_id, vet_name, location, type_id, visit_date, notes, costs } = req.body;

        if (!pet_id || !visit_date) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID and visit date are required'
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
                message: 'You do not have permission to add vet visit for this pet'
            });
        }

        const newVetVisit = await VetVisit.create({
            pet_id,
            vet_name,
            location,
            type_id,
            visit_date,
            notes,
            costs
        });

        res.status(201).json({
            success: true,
            message: 'Vet visit record created successfully',
            data: newVetVisit
        });
    } catch (error) {
        console.error('Add vet visit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create vet visit record'
        });
    }
};

/**
 * Update an existing vet visit record
 * @route PUT /api/vet-visits/:id
 */
const updateVetVisit = async (req, res) => {
    try {
        const userId = req.user.userId;
        const visitId = req.params.id;
        const { vet_name, location, type_id, visit_date, notes, costs } = req.body;

        // Get vet visit with owner info
        const vetVisit = await VetVisit.getByIdWithOwner(visitId);
        if (!vetVisit) {
            return res.status(404).json({
                success: false,
                message: 'Vet visit record not found'
            });
        }

        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, vetVisit.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this vet visit record'
            });
        }

        // Update vet visit
        const updatedVetVisit = await VetVisit.update(visitId, {
            vet_name,
            location,
            type_id,
            visit_date,
            notes,
            costs
        });

        res.status(200).json({
            success: true,
            message: 'Vet visit record updated successfully',
            data: updatedVetVisit
        });
    } catch (error) {
        console.error('Update vet visit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vet visit record'
        });
    }
};

/**
 * Delete a vet visit record
 * @route DELETE /api/vet-visits/:id
 */
const deleteVetVisit = async (req, res) => {
    try {
        const userId = req.user.userId;
        const visitId = req.params.id;

        // Get vet visit with owner info
        const vetVisit = await VetVisit.getByIdWithOwner(visitId);
        if (!vetVisit) {
            return res.status(404).json({
                success: false,
                message: 'Vet visit record not found'
            });
        }

        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, vetVisit.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this vet visit record'
            });
        }

        // Delete vet visit
        const deleted = await VetVisit.deleteById(visitId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Vet visit record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vet visit record deleted successfully'
        });
    } catch (error) {
        console.error('Delete vet visit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete vet visit record'
        });
    }
};

/**
 * Get all vet visit types
 * @route GET /api/vet-visit-types
 */
const getVetVisitTypes = async (req, res) => {
    try {
        const types = await VetVisit.getAllTypes();

        res.status(200).json({
            success: true,
            message: 'Vet visit types retrieved successfully',
            data: types
        });
    } catch (error) {
        console.error('Get vet visit types error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve vet visit types'
        });
    }
};

module.exports = {
    getUserPetVetVisits,
    addVetVisit,
    updateVetVisit,
    deleteVetVisit,
    getVetVisitTypes
};

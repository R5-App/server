const Vaccination = require('../models/Vaccination');
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
 * Get all vaccinations for the authenticated user's pets
 * @route GET /api/vaccinations
 */
const getUserPetVaccinations = async (req, res) => {
    try {
        // Use effectiveUserId for sub-user support (set by resolveEffectiveUser middleware)
        const userId = req.effectiveUserId || req.user.userId;

        const vaccinations = await Vaccination.getAllByUserId(userId);

        // Group vaccinations by pet
        const groupedByPet = vaccinations.reduce((acc, vaccination) => {
            const petId = vaccination.pet_id;
            
            if (!acc[petId]) {
                acc[petId] = {
                    pet_id: petId,
                    pet_name: vaccination.pet_name,
                    pet_type: vaccination.pet_type,
                    vaccinations: []
                };
            }
            
            // Add vaccination without pet info (since it's now in the parent object)
            acc[petId].vaccinations.push({
                id: vaccination.id,
                vac_name: vaccination.vac_name,
                vaccination_date: vaccination.vaccination_date,
                expire_date: vaccination.expire_date,
                notes: vaccination.notes,
                costs: vaccination.costs
            });
            
            return acc;
        }, {});

        // Convert object to array
        const result = Object.values(groupedByPet);

        res.status(200).json({
            success: true,
            message: 'Vaccinations retrieved successfully',
            data: result,
            total_pets: result.length,
            total_vaccinations: vaccinations.length
        });
    } catch (error) {
        console.error('Get vaccinations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve vaccinations'
        });
    }
};

/**
 * Add a new vaccination record for a pet
 * @route POST /api/vaccinations
 */
const addVaccination = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pet_id, vac_name, vaccination_date, expire_date, notes, costs } = req.body;

        if (!pet_id || !vac_name || !vaccination_date) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID, vaccination name, and vaccination date are required'
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
                message: 'You do not have permission to add vaccination for this pet'
            });
        }

        const newVaccination = await Vaccination.create({
            pet_id,
            vac_name,
            vaccination_date,
            expire_date,
            notes,
            costs
        });

        res.status(201).json({
            success: true,
            message: 'Vaccination record created successfully',
            data: newVaccination
        });
    } catch (error) {
        console.error('Add vaccination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create vaccination record'
        });
    }
};

/**
 * Update an existing vaccination record
 * @route PUT /api/vaccinations/:id
 */
const updateVaccination = async (req, res) => {
    try {
        const userId = req.user.userId;
        const vaccinationId = req.params.id;
        const { vac_name, vaccination_date, expire_date, notes, costs } = req.body;

        // Get vaccination with owner info
        const vaccination = await Vaccination.getByIdWithOwner(vaccinationId);
        if (!vaccination) {
            return res.status(404).json({
                success: false,
                message: 'Vaccination record not found'
            });
        }

        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, vaccination.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this vaccination record'
            });
        }

        // Update vaccination
        const updatedVaccination = await Vaccination.update(vaccinationId, {
            vac_name,
            vaccination_date,
            expire_date,
            notes,
            costs
        });

        res.status(200).json({
            success: true,
            message: 'Vaccination record updated successfully',
            data: updatedVaccination
        });
    } catch (error) {
        console.error('Update vaccination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vaccination record'
        });
    }
};

/**
 * Delete a vaccination record
 * @route DELETE /api/vaccinations/:id
 */
const deleteVaccination = async (req, res) => {
    try {
        const userId = req.user.userId;
        const vaccinationId = req.params.id;

        // Get vaccination with owner info
        const vaccination = await Vaccination.getByIdWithOwner(vaccinationId);
        if (!vaccination) {
            return res.status(404).json({
                success: false,
                message: 'Vaccination record not found'
            });
        }

        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, vaccination.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this vaccination record'
            });
        }

        // Delete vaccination
        const deleted = await Vaccination.deleteById(vaccinationId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Vaccination record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vaccination record deleted successfully'
        });
    } catch (error) {
        console.error('Delete vaccination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete vaccination record'
        });
    }
};

module.exports = {
    getUserPetVaccinations,
    addVaccination,
    updateVaccination,
    deleteVaccination
};

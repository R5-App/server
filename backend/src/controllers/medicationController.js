const Medication = require('../models/Medication');
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
 * Get all medications for the authenticated user's pets
 * @route GET /api/medications
 */
const getUserPetMedications = async (req, res) => {
    try {
        // Use effectiveUserId for sub-user support (set by resolveEffectiveUser middleware)
        const userId = req.effectiveUserId || req.user.userId;

        const medications = await Medication.getAllByUserId(userId);

        // Group medications by pet
        const groupedByPet = medications.reduce((acc, medication) => {
            const petId = medication.pet_id;
            
            if (!acc[petId]) {
                acc[petId] = {
                    pet_id: petId,
                    pet_name: medication.pet_name,
                    pet_type: medication.pet_type,
                    medications: []
                };
            }
            
            // Add medication without pet info (since it's now in the parent object)
            acc[petId].medications.push({
                id: medication.id,
                med_name: medication.med_name,
                medication_date: medication.medication_date,
                expire_date: medication.expire_date,
                notes: medication.notes,
                costs: medication.costs
            });
            
            return acc;
        }, {});

        // Convert object to array
        const result = Object.values(groupedByPet);

        res.status(200).json({
            success: true,
            message: 'Medications retrieved successfully',
            data: result,
            total_pets: result.length,
            total_medications: medications.length
        });
    } catch (error) {
        console.error('Get medications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve medications'
        });
    }
};

/**
 * Add a new medication record for a pet
 * @route POST /api/medications
 */
const addMedication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pet_id, med_name, medication_date, expire_date, notes, costs } = req.body;

        if (!pet_id || !med_name || !medication_date) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID, medication name, and medication date are required'
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
                message: 'You do not have permission to add medication for this pet'
            });
        }

        const newMedication = await Medication.create({
            pet_id,
            med_name,
            medication_date,
            expire_date,
            notes,
            costs
        });

        res.status(201).json({
            success: true,
            message: 'Medication record created successfully',
            data: newMedication
        });
    } catch (error) {
        console.error('Add medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create medication record'
        });
    }
};

/**
 * Update an existing medication record
 * @route PUT /api/medications/:id
 */
const updateMedication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const medicationId = req.params.id;
        const { med_name, medication_date, expire_date, notes, costs } = req.body;

        // Get medication with owner info
        const medication = await Medication.getByIdWithOwner(medicationId);
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication record not found'
            });
        }

        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, medication.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this medication record'
            });
        }

        // Update medication
        const updatedMedication = await Medication.update(medicationId, {
            med_name,
            medication_date,
            expire_date,
            notes,
            costs
        });

        res.status(200).json({
            success: true,
            message: 'Medication record updated successfully',
            data: updatedMedication
        });
    } catch (error) {
        console.error('Update medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update medication record'
        });
    }
};

/**
 * Delete a medication record
 * @route DELETE /api/medications/:id
 */
const deleteMedication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const medicationId = req.params.id;

        // Get medication with owner info
        const medication = await Medication.getByIdWithOwner(medicationId);
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication record not found'
            });
        }

        // Check if user has permission (owner or sub-user with omistaja role)
        const hasPermission = await hasPermissionForPet(userId, medication.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this medication record'
            });
        }

        // Delete medication
        const deleted = await Medication.deleteById(medicationId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Medication record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Medication record deleted successfully'
        });
    } catch (error) {
        console.error('Delete medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete medication record'
        });
    }
};

module.exports = {
    getUserPetMedications,
    addMedication,
    updateMedication,
    deleteMedication
};

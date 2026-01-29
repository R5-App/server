const Pet = require ('../models/Pet');

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

module.exports = {
    getUserPets,
    addPet,
    deletePet
}
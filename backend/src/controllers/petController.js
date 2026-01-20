const Pet = require ('../models/Pet');

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

module.exports = {
    addPet
}
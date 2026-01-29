const express = require('express');
const router = express.Router();
const { getUserPets, addPet, deletePet } = require('../controllers/petController');
const authenticateToken = require('../middleware/authenticateToken');
const resolveEffectiveUser = require('../middleware/resolveEffectiveUser');

/**
 * @route GET /api/pets
 * @desc Get all pets for the authenticated user
 * @access Private (all sub-users can view)
 */
router.get('/', authenticateToken, resolveEffectiveUser, getUserPets);

/**
 * @route POST /api/pets
 * @desc Create a new pet
 * @access Private
 */
router.post('/', authenticateToken, addPet);

/**
 * @route DELETE /api/pets/:petId
 * @desc Delete a pet by ID
 * @access Private (only pet owner)
 */
router.delete('/:petId', authenticateToken, deletePet);



module.exports = router;
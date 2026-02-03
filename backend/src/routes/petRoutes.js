const express = require('express');
const router = express.Router();
const { getUserPets, addPet, deletePet, getCompletePetData } = require('../controllers/petController');
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
 * @route GET /api/pets/:petId/complete
 * @desc Get complete pet data including all medications, vaccinations, weights, and vet visits
 * @access Private (pet owner and sub-users)
 */
router.get('/:petId/complete', authenticateToken, resolveEffectiveUser, getCompletePetData);

/**
 * @route DELETE /api/pets/:petId
 * @desc Delete a pet by ID
 * @access Private (only pet owner)
 */
router.delete('/:petId', authenticateToken, deletePet);



module.exports = router;
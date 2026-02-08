const express = require('express');
const router = express.Router();
const { getUserPets, addPet, deletePet, getPetById, updatePet, getCompletePetData, generatePetShareCode, redeemPetShareCode, getSharedUsers, removeSharedUser } = require('../controllers/petController');
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
 * @route POST /api/pets/redeem
 * @desc Redeem a share code to gain access to a pet
 * @access Private
 */
router.post('/redeem', authenticateToken, redeemPetShareCode);

/**
 * @route GET /api/pets/:petId/complete
 * @desc Get complete pet data including all medications, vaccinations, weights, and vet visits
 * @access Private (pet owner and sub-users)
 */
router.get('/:petId/complete', authenticateToken, resolveEffectiveUser, getCompletePetData);

/**
 * @route GET /api/pets/:petId
 * @desc Get pet details by ID (basic info only)
 * @access Private (pet owner and sub-users)
 */
router.get('/:petId', authenticateToken, resolveEffectiveUser, getPetById);

/**
 * @route PUT /api/pets/:petId
 * @desc Update pet details by pet ID
 * @access Private (only pet owner)
 */
router.put('/:petId', authenticateToken, updatePet);

/**
 * @route POST /api/pets/:petId/share
 * @desc Generate a temporary share code for a pet
 * @access Private (only pet owner)
 */
router.post('/:petId/share', authenticateToken, generatePetShareCode);

/**
 * @route GET /api/pets/:petId/shared-users
 * @desc Get all users who have access to a pet
 * @access Private (only pet owner)
 */
router.get('/:petId/shared-users', authenticateToken, getSharedUsers);

/**
 * @route DELETE /api/pets/:petId/shared-users/:sharedUserId
 * @desc Remove a user's access to a pet
 * @access Private (only pet owner)
 */
router.delete('/:petId/shared-users/:sharedUserId', authenticateToken, removeSharedUser);

/**
 * @route DELETE /api/pets/:petId
 * @desc Delete a pet by ID
 * @access Private (only pet owner)
 */
router.delete('/:petId', authenticateToken, deletePet);



module.exports = router;
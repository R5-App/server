const express = require('express');
const router = express.Router();
const { getUserPets, addPet } = require('../controllers/petController');
const authenticateToken = require('../middleware/authenticateToken');
const resolveEffectiveUser = require('../middleware/resolveEffectiveUser');

/**
 * @route GET /api/pets
 * @desc Get all pets for the authenticated user
 * @access Private (all sub-users can view)
 */
router.get('/', authenticateToken, resolveEffectiveUser, getUserPets);

router.post('/', authenticateToken, addPet);

/**
 * @route POST /api/
 */
module.exports = router;
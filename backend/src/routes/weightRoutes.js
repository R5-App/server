const express = require('express');
const router = express.Router();
const { getUserPetWeights, addWeight, updateWeight, deleteWeight } = require('../controllers/weightController');
const authenticateToken = require('../middleware/authenticateToken');
const resolveEffectiveUser = require('../middleware/resolveEffectiveUser');

/**
 * @route GET /api/weights
 * @desc Get all weight records for the authenticated user's pets
 * @access Private (all sub-users can view)
 */
router.get('/', authenticateToken, resolveEffectiveUser, getUserPetWeights);

/**
 * @route POST /api/weights
 * @desc Add a new weight record for a pet
 * @access Private (owner or sub-user with omistaja role)
 */
router.post('/', authenticateToken, addWeight);

/**
 * @route PUT /api/weights/:id
 * @desc Update an existing weight record
 * @access Private (owner or sub-user with omistaja role)
 */
router.put('/:id', authenticateToken, updateWeight);

/**
 * @route DELETE /api/weights/:id
 * @desc Delete a weight record
 * @access Private (owner or sub-user with omistaja role)
 */
router.delete('/:id', authenticateToken, deleteWeight);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getUserPetMedications, addMedication, updateMedication, deleteMedication } = require('../controllers/medicationController');
const authenticateToken = require('../middleware/authenticateToken');
const resolveEffectiveUser = require('../middleware/resolveEffectiveUser');

/**
 * @route GET /api/medications
 * @desc Get all medications for the authenticated user's pets
 * @access Private (all sub-users can view)
 */
router.get('/', authenticateToken, resolveEffectiveUser, getUserPetMedications);

/**
 * @route POST /api/medications
 * @desc Add a new medication record for a pet
 * @access Private
 */
router.post('/', authenticateToken, addMedication);

/**
 * @route PUT /api/medications/:id
 * @desc Update an existing medication record
 * @access Private (owner or sub-user with omistaja role)
 */
router.put('/:id', authenticateToken, updateMedication);

/**
 * @route DELETE /api/medications/:id
 * @desc Delete a medication record
 * @access Private (owner or sub-user with omistaja role)
 */
router.delete('/:id', authenticateToken, deleteMedication);

module.exports = router;

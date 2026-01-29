const express = require('express');
const router = express.Router();
const { getUserPetVaccinations, addVaccination, updateVaccination, deleteVaccination } = require('../controllers/vaccinationController');
const authenticateToken = require('../middleware/authenticateToken');
const resolveEffectiveUser = require('../middleware/resolveEffectiveUser');

/**
 * @route GET /api/vaccinations
 * @desc Get all vaccinations for the authenticated user's pets
 * @access Private (all sub-users can view)
 */
router.get('/', authenticateToken, resolveEffectiveUser, getUserPetVaccinations);

/**
 * @route POST /api/vaccinations
 * @desc Add a new vaccination record for a pet
 * @access Private (owner or sub-user with omistaja role)
 */
router.post('/', authenticateToken, addVaccination);

/**
 * @route PUT /api/vaccinations/:id
 * @desc Update an existing vaccination record
 * @access Private (owner or sub-user with omistaja role)
 */
router.put('/:id', authenticateToken, updateVaccination);

/**
 * @route DELETE /api/vaccinations/:id
 * @desc Delete a vaccination record
 * @access Private (owner or sub-user with omistaja role)
 */
router.delete('/:id', authenticateToken, deleteVaccination);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getUserPetVetVisits, addVetVisit, updateVetVisit, deleteVetVisit, getVetVisitTypes } = require('../controllers/vetVisitController');
const authenticateToken = require('../middleware/authenticateToken');
const resolveEffectiveUser = require('../middleware/resolveEffectiveUser');

/**
 * @route GET /api/vet-visit-types
 * @desc Get all vet visit types
 * @access Private
 */
router.get('/types', authenticateToken, getVetVisitTypes);

/**
 * @route GET /api/vet-visits
 * @desc Get all vet visits for the authenticated user's pets
 * @access Private (all sub-users can view)
 */
router.get('/', authenticateToken, resolveEffectiveUser, getUserPetVetVisits);

/**
 * @route POST /api/vet-visits
 * @desc Add a new vet visit record for a pet
 * @access Private (owner or sub-user with omistaja role)
 */
router.post('/', authenticateToken, addVetVisit);

/**
 * @route PUT /api/vet-visits/:id
 * @desc Update an existing vet visit record
 * @access Private (owner or sub-user with omistaja role)
 */
router.put('/:id', authenticateToken, updateVetVisit);

/**
 * @route DELETE /api/vet-visits/:id
 * @desc Delete a vet visit record
 * @access Private (owner or sub-user with omistaja role)
 */
router.delete('/:id', authenticateToken, deleteVetVisit);

module.exports = router;

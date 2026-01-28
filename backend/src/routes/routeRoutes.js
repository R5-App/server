const express = require('express');
const router = express.Router();
const {
    createRoute,
    getRouteById,
    getRoutesByPetId,
    getUserRoutes,
    deleteRoute,
    addCoordinates,
    updateRouteStats
} = require('../controllers/routeController');
const authenticateToken = require('../middleware/authenticateToken');
const resolveEffectiveUser = require('../middleware/resolveEffectiveUser');

/**
 * @route POST /api/routes
 * @desc Create a new route with coordinates
 * @access Private
 */
router.post('/', authenticateToken, createRoute);

/**
 * @route GET /api/routes
 * @desc Get all routes for the authenticated user
 * @access Private (all sub-users can view)
 */
router.get('/', authenticateToken, resolveEffectiveUser, getUserRoutes);

/**
 * @route GET /api/routes/:id
 * @desc Get a specific route by ID with all coordinates
 * @access Private
 */
router.get('/:id', authenticateToken, getRouteById);

/**
 * @route GET /api/routes/pet/:petId
 * @desc Get all routes for a specific pet
 * @access Private
 */
router.get('/pet/:petId', authenticateToken, getRoutesByPetId);

/**
 * @route DELETE /api/routes/:id
 * @desc Delete a route by ID
 * @access Private
 */
router.delete('/:id', authenticateToken, deleteRoute);

/**
 * @route POST /api/routes/:id/coordinates
 * @desc Add coordinates to an existing route
 * @access Private
 */
router.post('/:id/coordinates', authenticateToken, addCoordinates);

/**
 * @route PATCH /api/routes/:id
 * @desc Update route statistics (ended_at, distance, duration, speed)
 * @access Private
 */
router.patch('/:id', authenticateToken, updateRouteStats);

module.exports = router;

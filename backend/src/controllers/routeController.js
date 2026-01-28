const Route = require('../models/Route');
const Pet = require('../models/Pet');

/**
 * Create a new route with coordinates
 * @route POST /api/routes
 */
const createRoute = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { 
            pet_id, 
            started_at, 
            ended_at, 
            distance_m, 
            duration_s, 
            avg_speed_mps, 
            coordinates 
        } = req.body;

        // Validate required fields
        if (!pet_id || !started_at || !ended_at) {
            return res.status(400).json({
                success: false,
                message: 'pet_id, started_at, and ended_at are required'
            });
        }

        // Verify pet belongs to user
        const petBelongsToUser = await Pet.belongsToUser(pet_id, userId);
        if (!petBelongsToUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Pet does not belong to user'
            });
        }

        // Validate coordinates if provided
        if (coordinates && !Array.isArray(coordinates)) {
            return res.status(400).json({
                success: false,
                message: 'coordinates must be an array'
            });
        }

        const newRoute = await Route.create({
            pet_id,
            user_id: userId,
            started_at,
            ended_at,
            distance_m,
            duration_s,
            avg_speed_mps,
            coordinates
        });

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: newRoute
        });
    } catch (error) {
        console.error('Create route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create route'
        });
    }
};

/**
 * Get route by ID with coordinates
 * @route GET /api/routes/:id
 */
const getRouteById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const routeId = req.params.id;

        // Verify route belongs to user
        const belongsToUser = await Route.belongsToUser(routeId, userId);
        if (!belongsToUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Route does not belong to user'
            });
        }

        const route = await Route.getById(routeId);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Route retrieved successfully',
            data: route
        });
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve route'
        });
    }
};

/**
 * Get all routes for a specific pet
 * @route GET /api/routes/pet/:petId
 */
const getRoutesByPetId = async (req, res) => {
    try {
        const userId = req.user.userId;
        const petId = req.params.petId;

        // Verify pet belongs to user
        const petBelongsToUser = await Pet.belongsToUser(petId, userId);
        if (!petBelongsToUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Pet does not belong to user'
            });
        }

        const routes = await Route.getAllByPetId(petId);

        res.status(200).json({
            success: true,
            message: 'Routes retrieved successfully',
            data: routes,
            count: routes.length
        });
    } catch (error) {
        console.error('Get routes by pet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve routes'
        });
    }
};

/**
 * Get all routes for the authenticated user
 * @route GET /api/routes
 */
const getUserRoutes = async (req, res) => {
    try {
        const userId = req.effectiveUserId || req.user.userId;

        const routes = await Route.getAllByUserId(userId);

        res.status(200).json({
            success: true,
            message: 'Routes retrieved successfully',
            data: routes,
            count: routes.length
        });
    } catch (error) {
        console.error('Get user routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve routes'
        });
    }
};

/**
 * Delete route by ID
 * @route DELETE /api/routes/:id
 */
const deleteRoute = async (req, res) => {
    try {
        const userId = req.user.userId;
        const routeId = req.params.id;

        // Verify route belongs to user
        const belongsToUser = await Route.belongsToUser(routeId, userId);
        if (!belongsToUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Route does not belong to user'
            });
        }

        const deleted = await Route.deleteById(routeId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Route deleted successfully'
        });
    } catch (error) {
        console.error('Delete route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete route'
        });
    }
};

/**
 * Add coordinates to an existing route
 * @route POST /api/routes/:id/coordinates
 */
const addCoordinates = async (req, res) => {
    try {
        const userId = req.user.userId;
        const routeId = req.params.id;
        const { coordinates } = req.body;

        if (!coordinates || !Array.isArray(coordinates)) {
            return res.status(400).json({
                success: false,
                message: 'coordinates must be an array'
            });
        }

        // Verify route belongs to user
        const belongsToUser = await Route.belongsToUser(routeId, userId);
        if (!belongsToUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Route does not belong to user'
            });
        }

        await Route.addCoordinates(routeId, coordinates);

        res.status(200).json({
            success: true,
            message: 'Coordinates added successfully'
        });
    } catch (error) {
        console.error('Add coordinates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add coordinates'
        });
    }
};

/**
 * Update route statistics
 * @route PATCH /api/routes/:id
 */
const updateRouteStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const routeId = req.params.id;
        const { ended_at, distance_m, duration_s, avg_speed_mps } = req.body;

        // Verify route belongs to user
        const belongsToUser = await Route.belongsToUser(routeId, userId);
        if (!belongsToUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Route does not belong to user'
            });
        }

        const updatedRoute = await Route.updateStats(routeId, {
            ended_at,
            distance_m,
            duration_s,
            avg_speed_mps
        });

        res.status(200).json({
            success: true,
            message: 'Route updated successfully',
            data: updatedRoute
        });
    } catch (error) {
        console.error('Update route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update route'
        });
    }
};

module.exports = {
    createRoute,
    getRouteById,
    getRoutesByPetId,
    getUserRoutes,
    deleteRoute,
    addCoordinates,
    updateRouteStats
};

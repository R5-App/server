const pool = require('../config/database');

class Route {
    /**
     * Create a new route with coordinates
     * @param {object} routeData - Route data including coordinates
     * @returns {Promise<object>} Created route with ID
     */
    static async create({ pet_id, user_id, started_at, ended_at, distance_m, duration_s, avg_speed_mps, coordinates }) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Create the route
            const routeQuery = `
                INSERT INTO route (pet_id, user_id, started_at, ended_at, distance_m, duration_s, avg_speed_mps)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const routeResult = await client.query(routeQuery, [
                pet_id, 
                user_id, 
                started_at, 
                ended_at, 
                distance_m, 
                duration_s, 
                avg_speed_mps
            ]);

            const route = routeResult.rows[0];

            // Insert coordinates if provided
            if (coordinates && coordinates.length > 0) {
                const coordsQuery = `
                    INSERT INTO route_coordinates (route_id, latitude, longitude, altitude, accuracy, timestamp, speed_mps)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;
                
                for (const coord of coordinates) {
                    await client.query(coordsQuery, [
                        route.id,
                        coord.latitude,
                        coord.longitude,
                        coord.altitude || null,
                        coord.accuracy || null,
                        coord.timestamp,
                        coord.speed_mps || null
                    ]);
                }
            }

            await client.query('COMMIT');
            return route;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get route by ID with all coordinates
     * @param {number} routeId - Route ID
     * @returns {Promise<object>} Route with coordinates array
     */
    static async getById(routeId) {
        try {
            const routeQuery = 'SELECT * FROM route WHERE id = $1';
            const routeResult = await pool.query(routeQuery, [routeId]);
            
            if (routeResult.rows.length === 0) {
                return null;
            }

            const route = routeResult.rows[0];

            // Get coordinates
            const coordsQuery = `
                SELECT latitude, longitude, altitude, accuracy, timestamp, speed_mps
                FROM route_coordinates
                WHERE route_id = $1
                ORDER BY timestamp ASC
            `;
            const coordsResult = await pool.query(coordsQuery, [routeId]);

            route.coordinates = coordsResult.rows;
            return route;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all routes for a specific pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Array>} Array of routes
     */
    static async getAllByPetId(petId) {
        const query = `
            SELECT id, pet_id, user_id, started_at, ended_at, 
                   distance_m, duration_s, avg_speed_mps
            FROM route
            WHERE pet_id = $1
            ORDER BY started_at DESC
        `;

        try {
            const result = await pool.query(query, [petId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all routes for a specific user
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<Array>} Array of routes
     */
    static async getAllByUserId(userId) {
        const query = `
            SELECT r.id, r.pet_id, r.user_id, r.started_at, r.ended_at,
                   r.distance_m, r.duration_s, r.avg_speed_mps,
                   p.name as pet_name
            FROM route r
            LEFT JOIN pets p ON r.pet_id = p.id
            WHERE r.user_id = $1
            ORDER BY r.started_at DESC
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete route by ID
     * @param {number} routeId - Route ID
     * @returns {Promise<boolean>} true if route was deleted
     */
    static async deleteById(routeId) {
        const query = 'DELETE FROM route WHERE id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [routeId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify if a route belongs to a specific user
     * @param {number} routeId - Route ID
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<boolean>} true if route belongs to user
     */
    static async belongsToUser(routeId, userId) {
        const query = 'SELECT id FROM route WHERE id = $1 AND user_id = $2';

        try {
            const result = await pool.query(query, [routeId, userId]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add coordinates to an existing route
     * @param {number} routeId - Route ID
     * @param {Array} coordinates - Array of coordinate objects
     * @returns {Promise<boolean>} true if coordinates were added
     */
    static async addCoordinates(routeId, coordinates) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const coordsQuery = `
                INSERT INTO route_coordinates (route_id, latitude, longitude, altitude, accuracy, timestamp, speed_mps)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            for (const coord of coordinates) {
                await client.query(coordsQuery, [
                    routeId,
                    coord.latitude,
                    coord.longitude,
                    coord.altitude || null,
                    coord.accuracy || null,
                    coord.timestamp,
                    coord.speed_mps || null
                ]);
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update route statistics
     * @param {number} routeId - Route ID
     * @param {object} stats - Statistics to update
     * @returns {Promise<object>} Updated route
     */
    static async updateStats(routeId, { ended_at, distance_m, duration_s, avg_speed_mps }) {
        const query = `
            UPDATE route
            SET ended_at = COALESCE($2, ended_at),
                distance_m = COALESCE($3, distance_m),
                duration_s = COALESCE($4, duration_s),
                avg_speed_mps = COALESCE($5, avg_speed_mps)
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [
                routeId,
                ended_at,
                distance_m,
                duration_s,
                avg_speed_mps
            ]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Route;

const pool = require('../config/database');

class VetVisit {
    /**
     * Get all vet visits for a specific pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Array>} Array of vet visits
     */
    static async getByPetId(petId) {
        const query = `
            SELECT * FROM vet_visits 
            WHERE pet_id = $1
            ORDER BY visit_date DESC
        `;

        try {
            const result = await pool.query(query, [petId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all vet visits for multiple pets
     * @param {Array<number>} petIds - Array of pet IDs
     * @returns {Promise<Array>} Array of vet visits
     */
    static async getByPetIds(petIds) {
        const query = `
            SELECT vv.*, p.name as pet_name
            FROM vet_visits vv
            JOIN pets p ON vv.pet_id = p.id
            WHERE vv.pet_id = ANY($1)
            ORDER BY p.name, vv.visit_date DESC
        `;

        try {
            const result = await pool.query(query, [petIds]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all vet visits for a user's pets
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<Array>} Array of vet visits with pet information
     */
    static async getAllByUserId(userId) {
        const query = `
            SELECT vv.*, p.name as pet_name, p.type as pet_type, 
                   vvt.name as type_name
            FROM vet_visits vv
            JOIN pets p ON vv.pet_id = p.id
            LEFT JOIN vet_visit_types vvt ON vv.type_id = vvt.id
            WHERE p.owner_id = $1
            ORDER BY p.name, vv.visit_date DESC
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new vet visit record
     * @param {object} visitData - Vet visit data
     * @returns {Promise<object>} Created vet visit
     */
    static async create({ pet_id, vet_name, location, type_id, visit_date, notes, costs }) {
        const query = `
            INSERT INTO vet_visits (pet_id, vet_name, location, type_id, visit_date, notes, costs)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [pet_id, vet_name, location, type_id, visit_date, notes, costs]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update vet visit by ID
     * @param {number} visitId - Vet visit ID
     * @param {object} updates - Fields to update
     * @returns {Promise<object>} Updated vet visit
     */
    static async update(visitId, { vet_name, location, type_id, visit_date, notes, costs }) {
        const query = `
            UPDATE vet_visits
            SET vet_name = COALESCE($1, vet_name),
                location = COALESCE($2, location),
                type_id = COALESCE($3, type_id),
                visit_date = COALESCE($4, visit_date),
                notes = COALESCE($5, notes),
                costs = COALESCE($6, costs)
            WHERE id = $7
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [vet_name, location, type_id, visit_date, notes, costs, visitId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get vet visit by ID with pet owner information
     * @param {number} visitId - Vet visit ID
     * @returns {Promise<object|null>} Vet visit with owner info or null
     */
    static async getByIdWithOwner(visitId) {
        const query = `
            SELECT vv.*, p.owner_id, p.name as pet_name
            FROM vet_visits vv
            JOIN pets p ON vv.pet_id = p.id
            WHERE vv.id = $1
        `;

        try {
            const result = await pool.query(query, [visitId]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete vet visit by ID
     * @param {number} visitId - Vet visit ID
     * @returns {Promise<boolean>} true if vet visit was deleted
     */
    static async deleteById(visitId) {
        const query = 'DELETE FROM vet_visits WHERE id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [visitId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all vet visit types
     * @returns {Promise<Array>} Array of vet visit types
     */
    static async getAllTypes() {
        const query = 'SELECT id, name FROM vet_visit_types ORDER BY id';

        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = VetVisit;

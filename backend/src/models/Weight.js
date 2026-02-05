const pool = require('../config/database');

class Weight {
    /**
     * Get all weights for a specific pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Array>} Array of weight records
     */
    static async getByPetId(petId) {
        const query = `
            SELECT * FROM pet_weights 
            WHERE pet_id = $1
            ORDER BY date DESC
        `;

        try {
            const result = await pool.query(query, [petId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all weights for a user's pets (owned and shared)
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<Array>} Array of weight records with pet information
     */
    static async getAllByUserId(userId) {
        const query = `
            SELECT DISTINCT pw.*, p.name as pet_name, p.type as pet_type
            FROM pet_weights pw
            JOIN pets p ON pw.pet_id = p.id
            LEFT JOIN pet_users pu ON p.id = pu.pet_id
            WHERE p.owner_id = $1 OR pu.user_id = $1
            ORDER BY p.name, pw.date DESC
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new weight record
     * @param {object} weightData - Weight data
     * @returns {Promise<object>} Created weight record
     */
    static async create({ pet_id, weight, date }) {
        const query = `
            INSERT INTO pet_weights (pet_id, weight, date)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [pet_id, weight, date]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update weight record by ID
     * @param {number} weightId - Weight record ID
     * @param {object} updates - Fields to update
     * @returns {Promise<object>} Updated weight record
     */
    static async update(weightId, { weight, date }) {
        const query = `
            UPDATE pet_weights
            SET weight = COALESCE($1, weight),
                date = COALESCE($2, date)
            WHERE id = $3
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [weight, date, weightId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get weight record by ID with pet owner information
     * @param {number} weightId - Weight record ID
     * @returns {Promise<object|null>} Weight record with owner info or null
     */
    static async getByIdWithOwner(weightId) {
        const query = `
            SELECT pw.*, p.owner_id, p.name as pet_name
            FROM pet_weights pw
            JOIN pets p ON pw.pet_id = p.id
            WHERE pw.id = $1
        `;

        try {
            const result = await pool.query(query, [weightId]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete weight record by ID
     * @param {number} weightId - Weight record ID
     * @returns {Promise<boolean>} true if weight record was deleted
     */
    static async deleteById(weightId) {
        const query = 'DELETE FROM pet_weights WHERE id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [weightId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Weight;

const pool = require('../config/database');

class Medication {
    /**
     * Get all medications for a specific pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Array>} Array of medications
     */
    static async getByPetId(petId) {
        const query = `
            SELECT * FROM pet_medication 
            WHERE pet_id = $1
            ORDER BY medication_date DESC
        `;

        try {
            const result = await pool.query(query, [petId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all medications for multiple pets
     * @param {Array<number>} petIds - Array of pet IDs
     * @returns {Promise<Array>} Array of medications
     */
    static async getByPetIds(petIds) {
        const query = `
            SELECT pm.*, p.name as pet_name
            FROM pet_medication pm
            JOIN pets p ON pm.pet_id = p.id
            WHERE pm.pet_id = ANY($1)
            ORDER BY p.name, pm.medication_date DESC
        `;

        try {
            const result = await pool.query(query, [petIds]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all medications for a user's pets (owned and shared)
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<Array>} Array of medications with pet information
     */
    static async getAllByUserId(userId) {
        const query = `
            SELECT DISTINCT pm.*, p.name as pet_name, p.type as pet_type
            FROM pet_medication pm
            JOIN pets p ON pm.pet_id = p.id
            LEFT JOIN pet_users pu ON p.id = pu.pet_id
            WHERE p.owner_id = $1 OR pu.user_id = $1
            ORDER BY p.name, pm.medication_date DESC
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new medication record
     * @param {object} medicationData - Medication data
     * @returns {Promise<object>} Created medication
     */
    static async create({ pet_id, med_name, medication_date, expire_date, notes, costs }) {
        const query = `
            INSERT INTO pet_medication (pet_id, med_name, medication_date, expire_date, notes, costs)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [pet_id, med_name, medication_date, expire_date, notes, costs]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update medication by ID
     * @param {number} medicationId - Medication ID
     * @param {object} updates - Fields to update
     * @returns {Promise<object>} Updated medication
     */
    static async update(medicationId, { med_name, medication_date, expire_date, notes, costs }) {
        const query = `
            UPDATE pet_medication
            SET med_name = COALESCE($1, med_name),
                medication_date = COALESCE($2, medication_date),
                expire_date = COALESCE($3, expire_date),
                notes = COALESCE($4, notes),
                costs = COALESCE($5, costs)
            WHERE id = $6
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [med_name, medication_date, expire_date, notes, costs, medicationId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get medication by ID with pet owner information
     * @param {number} medicationId - Medication ID
     * @returns {Promise<object|null>} Medication with owner info or null
     */
    static async getByIdWithOwner(medicationId) {
        const query = `
            SELECT pm.*, p.owner_id, p.name as pet_name
            FROM pet_medication pm
            JOIN pets p ON pm.pet_id = p.id
            WHERE pm.id = $1
        `;

        try {
            const result = await pool.query(query, [medicationId]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete medication by ID
     * @param {number} medicationId - Medication ID
     * @returns {Promise<boolean>} true if medication was deleted
     */
    static async deleteById(medicationId) {
        const query = 'DELETE FROM pet_medication WHERE id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [medicationId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Medication;

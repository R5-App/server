const pool = require('../config/database');

class Vaccination {
    /**
     * Get all vaccinations for a specific pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Array>} Array of vaccinations
     */
    static async getByPetId(petId) {
        const query = `
            SELECT * FROM pet_vaccination 
            WHERE pet_id = $1
            ORDER BY vaccination_date DESC
        `;

        try {
            const result = await pool.query(query, [petId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all vaccinations for multiple pets
     * @param {Array<number>} petIds - Array of pet IDs
     * @returns {Promise<Array>} Array of vaccinations
     */
    static async getByPetIds(petIds) {
        const query = `
            SELECT pv.*, p.name as pet_name
            FROM pet_vaccination pv
            JOIN pets p ON pv.pet_id = p.id
            WHERE pv.pet_id = ANY($1)
            ORDER BY p.name, pv.vaccination_date DESC
        `;

        try {
            const result = await pool.query(query, [petIds]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all vaccinations for a user's pets
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<Array>} Array of vaccinations with pet information
     */
    static async getAllByUserId(userId) {
        const query = `
            SELECT pv.*, p.name as pet_name, p.type as pet_type
            FROM pet_vaccination pv
            JOIN pets p ON pv.pet_id = p.id
            WHERE p.owner_id = $1
            ORDER BY p.name, pv.vaccination_date DESC
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new vaccination record
     * @param {object} vaccinationData - Vaccination data
     * @returns {Promise<object>} Created vaccination
     */
    static async create({ pet_id, vac_name, vaccination_date, expire_date, notes, costs }) {
        const query = `
            INSERT INTO pet_vaccination (pet_id, vac_name, vaccination_date, expire_date, notes, costs)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [pet_id, vac_name, vaccination_date, expire_date, notes, costs]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update vaccination by ID
     * @param {number} vaccinationId - Vaccination ID
     * @param {object} updates - Fields to update
     * @returns {Promise<object>} Updated vaccination
     */
    static async update(vaccinationId, { vac_name, vaccination_date, expire_date, notes, costs }) {
        const query = `
            UPDATE pet_vaccination
            SET vac_name = COALESCE($1, vac_name),
                vaccination_date = COALESCE($2, vaccination_date),
                expire_date = COALESCE($3, expire_date),
                notes = COALESCE($4, notes),
                costs = COALESCE($5, costs)
            WHERE id = $6
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [vac_name, vaccination_date, expire_date, notes, costs, vaccinationId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get vaccination by ID with pet owner information
     * @param {number} vaccinationId - Vaccination ID
     * @returns {Promise<object|null>} Vaccination with owner info or null
     */
    static async getByIdWithOwner(vaccinationId) {
        const query = `
            SELECT pv.*, p.owner_id, p.name as pet_name
            FROM pet_vaccination pv
            JOIN pets p ON pv.pet_id = p.id
            WHERE pv.id = $1
        `;

        try {
            const result = await pool.query(query, [vaccinationId]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete vaccination by ID
     * @param {number} vaccinationId - Vaccination ID
     * @returns {Promise<boolean>} true if vaccination was deleted
     */
    static async deleteById(vaccinationId) {
        const query = 'DELETE FROM pet_vaccination WHERE id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [vaccinationId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Vaccination;

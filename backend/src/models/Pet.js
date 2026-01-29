const pool = require('../config/database');

class Pet {
    /** 
     * Create a new pet
     * @param {object} petData - Pet data
     * @returns {Promise<object>} Created pet
     */

    static async create({ owner_id, name, type, breed, sex, birthdate, notes}) {
        const query = `
        INSERT INTO pets (owner_id, name, type, breed, sex, birthdate, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `;

        try {
            const result = await pool.query(query, [owner_id, name, type, breed, sex, birthdate, notes]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete pet by ID
     * @param {string} petId - pet ID
     * @returns {Promise<boolean>} true if pet was deleted
     */
    static async deleteById(petId) {
        const query = 'DELETE FROM pets WHERE id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [petId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify if a pet belongs to a specific user
     * @param {number} petId - Pet ID
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<boolean>} true if pet belongs to user
     */
    static async belongsToUser(petId, userId) {
        const query = 'SELECT id FROM pets WHERE id = $1 AND owner_id = $2';

        try {
            const result = await pool.query(query, [petId, userId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all pets for a specific owner
     * @param {string} ownerId - Owner user ID (UUID)
     * @returns {Promise<Array>} Array of pets
     */
    static async getAllByOwnerId(ownerId) {
        const query = `
            SELECT id, owner_id, name, type, breed, sex, birthdate, notes, created_at
            FROM pets
            WHERE owner_id = $1
            ORDER BY created_at DESC
        `;

        try {
            const result = await pool.query(query, [ownerId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}


module.exports = Pet;
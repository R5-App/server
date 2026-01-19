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
}


module.exports = Pet;
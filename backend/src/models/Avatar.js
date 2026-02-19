const pool = require('../config/database');

class Avatar {
    /**
     * Create a new avatar/image record
     * @param {string} user_id - User ID (UUID)
     * @param {number} pet_id - Pet ID
     * @param {string} filename - Filename of the image
     * @returns {Promise<object>} Created avatar record
     */
    static async create({ user_id, pet_id, filename }) {
        const query = `
            INSERT INTO images (user_id, pet_id, filename)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [user_id, pet_id, filename]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get avatar by ID
     * @param {number} imageId - Image ID
     * @returns {Promise<object>} Avatar object or undefined if not found
     */
    static async getById(imageId) {
        const query = 'SELECT * FROM images WHERE id = $1';

        try {
            const result = await pool.query(query, [imageId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete avatar by ID
     * @param {number} imageId - Image ID
     * @returns {Promise<boolean>} true if avatar was deleted
     */
    static async deleteById(imageId) {
        const query = 'DELETE FROM images WHERE id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [imageId]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get current avatar for a specific pet
     * @param {number} petId - Pet ID
     * @returns {Promise<object|undefined>} Avatar object or undefined
     */
    static async getByPetId(petId) {
        const query = `
            SELECT id, user_id, pet_id, filename, created_at
            FROM images
            WHERE pet_id = $1
        `;

        try {
            const result = await pool.query(query, [petId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }


    /**
     * Delete avatar for a pet
     * @param {number} petId - Pet ID
     * @returns {Promise<boolean>} true if avatar was deleted
     */
    static async deleteByPetId(petId) {
        const query = 'DELETE FROM images WHERE pet_id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [petId]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get current avatar for a specific user (only one avatar per user)
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<object|undefined>} Avatar object or undefined
     */
    static async getByUserId(userId) {
        const query = `
            SELECT id, user_id, pet_id, filename, created_at
            FROM images
            WHERE user_id = $1 AND pet_id IS NULL
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete user's profile avatar (pet_id is NULL)
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<boolean>} true if deleted
     */
    static async deleteByUserId(userId) {
        const query = 'DELETE FROM images WHERE user_id = $1 AND pet_id IS NULL RETURNING id';

        try {
            const result = await pool.query(query, [userId]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify if an avatar belongs to a specific user
     * @param {number} imageId - Image ID
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<boolean>} true if avatar belongs to user
     */
    static async belongsToUser(imageId, userId) {
        const query = 'SELECT id FROM images WHERE id = $1 AND user_id = $2';

        try {
            const result = await pool.query(query, [imageId, userId]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify if an avatar is associated with a specific pet
     * @param {number} imageId - Image ID
     * @param {number} petId - Pet ID
     * @returns {Promise<boolean>} true if avatar belongs to pet
     */
    static async belongsToPet(imageId, petId) {
        const query = 'SELECT id FROM images WHERE id = $1 AND pet_id = $2';

        try {
            const result = await pool.query(query, [imageId, petId]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Avatar;

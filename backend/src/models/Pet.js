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
     * Get pet by ID
     * @param {string} petId - Pet ID
     * @returns {Promise<object>} Pet object or undefined if not found
     */
    static async getById(petId) {
        const query = 'SELECT * FROM pets WHERE id = $1';

        try {
            const result = await pool.query(query, [petId]);
            return result.rows[0];
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

    /**
     * Get all pets for a user including owned pets and shared pets
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<Array>} Array of pets (owned and shared) with role information
     */
    static async getAllByOwnerIdIncludingShared(userId) {
        const query = `
            SELECT DISTINCT p.id, p.owner_id, p.name, p.type, p.breed, p.sex, p.birthdate, p.notes, p.created_at,
                   CASE WHEN p.owner_id = $1 THEN true ELSE false END as is_owner,
                   CASE WHEN p.owner_id = $1 THEN 'omistaja' ELSE COALESCE(pu.role, 'hoitaja') END as role
            FROM pets p
            LEFT JOIN pet_users pu ON p.id = pu.pet_id AND pu.user_id = $1
            WHERE p.owner_id = $1 OR pu.user_id = $1
            ORDER BY p.created_at DESC
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get complete pet data with all related information
     * @param {number} petId - Pet ID
     * @returns {Promise<object>} Complete pet data including medications, vaccinations, weights, and vet visits
     */
    static async getCompleteDataById(petId) {
        const client = await pool.connect();

        try {
            // Get pet basic info
            const petQuery = `
                SELECT id, owner_id, name, type, breed, sex, birthdate, notes, created_at,
                       EXTRACT(YEAR FROM AGE(COALESCE(birthdate, CURRENT_DATE))) as age_years
                FROM pets
                WHERE id = $1
            `;
            const petResult = await client.query(petQuery, [petId]);
            
            if (petResult.rows.length === 0) {
                return null;
            }

            const pet = petResult.rows[0];

            // Get medications
            const medicationsQuery = `
                SELECT id, med_name, medication_date, expire_date, notes, costs
                FROM pet_medication
                WHERE pet_id = $1
                ORDER BY medication_date DESC
            `;
            const medicationsResult = await client.query(medicationsQuery, [petId]);

            // Get vaccinations
            const vaccinationsQuery = `
                SELECT id, vac_name, vaccination_date, expire_date, notes, costs
                FROM pet_vaccination
                WHERE pet_id = $1
                ORDER BY vaccination_date DESC
            `;
            const vaccinationsResult = await client.query(vaccinationsQuery, [petId]);

            // Get weights
            const weightsQuery = `
                SELECT id, weight, date, created_at
                FROM pet_weights
                WHERE pet_id = $1
                ORDER BY date DESC
            `;
            const weightsResult = await client.query(weightsQuery, [petId]);

            // Get vet visits
            const vetVisitsQuery = `
                SELECT vv.id, vv.vet_name, vv.location, vv.type_id, vv.visit_date, 
                       vv.notes, vv.costs, vvt.name as type_name
                FROM vet_visits vv
                LEFT JOIN vet_visit_types vvt ON vv.type_id = vvt.id
                WHERE vv.pet_id = $1
                ORDER BY vv.visit_date DESC
            `;
            const vetVisitsResult = await client.query(vetVisitsQuery, [petId]);

            return {
                ...pet,
                medications: medicationsResult.rows,
                vaccinations: vaccinationsResult.rows,
                weights: weightsResult.rows,
                vetVisits: vetVisitsResult.rows
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Add a user to the pet_users table (grant access to a pet)
     * @param {number} petId - Pet ID
     * @param {string} userId - User ID (UUID)
     * @param {string} ownerId - Owner user ID (UUID)
     * @param {string} role - User role (default: 'hoitaja')
     * @returns {Promise<object>} Created pet_user record
     */
    static async addSharedUser(petId, userId, ownerId, role = 'hoitaja') {
        const query = `
            INSERT INTO pet_users (pet_id, user_id, owner_id, role)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (pet_id, user_id) DO NOTHING
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [petId, userId, ownerId, role]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if a user has access to a pet (either owner or shared user)
     * @param {number} petId - Pet ID
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<boolean>} True if user has access
     */
    static async userHasAccess(petId, userId) {
        const query = `
            SELECT 1 FROM pets WHERE id = $1 AND owner_id = $2
            UNION
            SELECT 1 FROM pet_users WHERE pet_id = $1 AND user_id = $2
            LIMIT 1
        `;

        try {
            const result = await pool.query(query, [petId, userId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all pet IDs accessible to a user (owned and shared)
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<Array>} Array of pet IDs
     */
    static async getAccessiblePetIds(userId) {
        const query = `
            SELECT DISTINCT p.id
            FROM pets p
            LEFT JOIN pet_users pu ON p.id = pu.pet_id
            WHERE p.owner_id = $1 OR pu.user_id = $1
            ORDER BY p.id
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => row.id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user's access level for a pet
     * @param {number} petId - Pet ID
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<object>} Object with isOwner and role properties (for future permission restrictions)
     */
    static async getAccessLevel(petId, userId) {
        const query = `
            SELECT 
                CASE WHEN p.owner_id = $2 THEN true ELSE false END as is_owner,
                CASE WHEN p.owner_id = $2 THEN 'omistaja' ELSE COALESCE(pu.role, 'hoitaja') END as role
            FROM pets p
            LEFT JOIN pet_users pu ON p.id = pu.pet_id AND pu.user_id = $2
            WHERE p.id = $1 AND (p.owner_id = $2 OR pu.user_id = $2)
        `;

        try {
            const result = await pool.query(query, [petId, userId]);
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all users who have access to a pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Array>} Array of users with access
     */
    static async getSharedUsers(petId) {
        const query = `
            SELECT u.id, u.username, u.email, u.name, pu.role, pu.created_at as shared_at
            FROM pet_users pu
            JOIN users u ON pu.user_id = u.id
            WHERE pu.pet_id = $1
            ORDER BY pu.created_at DESC
        `;

        try {
            const result = await pool.query(query, [petId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Remove a user's access to a pet
     * @param {number} petId - Pet ID
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<boolean>} True if removed
     */
    static async removeSharedUser(petId, userId) {
        const query = 'DELETE FROM pet_users WHERE pet_id = $1 AND user_id = $2 RETURNING id';

        try {
            const result = await pool.query(query, [petId, userId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }
}


module.exports = Pet;
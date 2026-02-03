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
}


module.exports = Pet;